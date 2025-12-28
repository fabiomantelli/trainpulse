'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, addDays, addWeeks, addMonths, parse, isToday, startOfDay } from 'date-fns'
import { motion } from 'framer-motion'
import TimeSlotPicker from './TimeSlotPicker'
import { Database } from '@/types/database.types'
import toast from 'react-hot-toast'

type Client = Database['public']['Tables']['clients']['Row']
type Appointment = Database['public']['Tables']['appointments']['Row']

interface AppointmentFormProps {
  trainerId: string
  appointment?: Appointment | null
  clients: Client[]
  onSuccess: () => void
  onCancel: () => void
  initialDate?: Date | null
}

export default function AppointmentForm({
  trainerId,
  appointment,
  clients,
  onSuccess,
  onCancel,
  initialDate,
}: AppointmentFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    appointment ? new Date(appointment.scheduled_at) : (initialDate || new Date())
  )
  // Update selectedDate and selectedTime when initialDate changes (when modal opens with new date)
  useEffect(() => {
    if (initialDate && !appointment) {
      setSelectedDate(initialDate)
      // Extract time from initialDate and set selectedTime
      const hours = initialDate.getHours().toString().padStart(2, '0')
      const minutes = initialDate.getMinutes().toString().padStart(2, '0')
      const timeString = `${hours}:${minutes}`
      setSelectedTime(timeString)
    }
  }, [initialDate, appointment])
  const [selectedTime, setSelectedTime] = useState<string>(
    appointment
      ? format(new Date(appointment.scheduled_at), 'HH:mm')
      : '09:00'
  )
  const timeAdjustmentRef = useRef<string | null>(null)

  // Adjust selectedTime if it's in the past when date is today
  useEffect(() => {
    if (!appointment && isToday(selectedDate)) {
      const now = new Date()
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const selectedDateTime = new Date(selectedDate)
      selectedDateTime.setHours(hours, minutes, 0, 0)
      
      if (selectedDateTime < now) {
        // Find next available time slot (round up to next 30 minutes)
        const nextHour = now.getHours()
        const nextMinute = now.getMinutes() < 30 ? 30 : 0
        const nextHourAdjusted = nextMinute === 0 ? nextHour + 1 : nextHour
        // Ensure we don't go past 23:30
        if (nextHourAdjusted < 24) {
          const newTime = `${nextHourAdjusted.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`
          // Only adjust if we haven't already adjusted to this time
          if (timeAdjustmentRef.current !== newTime) {
            timeAdjustmentRef.current = newTime
            setSelectedTime(newTime)
          }
        }
      } else {
        // Reset ref when time is valid
        timeAdjustmentRef.current = null
      }
    } else {
      // Reset ref when date is not today
      timeAdjustmentRef.current = null
    }
  }, [selectedDate, appointment, selectedTime])
  const [selectedDuration, setSelectedDuration] = useState<number>(
    appointment?.duration_minutes || 60
  )
  const [selectedClientId, setSelectedClientId] = useState<string>(
    appointment?.client_id || ''
  )
  const [notes, setNotes] = useState<string>(appointment?.notes || '')
  const [status, setStatus] = useState<
    'scheduled' | 'completed' | 'cancelled' | 'no_show'
  >(appointment?.status || 'scheduled')
  const [loading, setLoading] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [conflictError, setConflictError] = useState<string | null>(null)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'bi-weekly' | 'monthly'>('weekly')
  const [numberOfOccurrences, setNumberOfOccurrences] = useState<number>(4)

  const supabase = createClient()

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  useEffect(() => {
    if (selectedDate && selectedTime && selectedClientId) {
      checkConflicts()
    }
  }, [selectedDate, selectedTime, selectedDuration, selectedClientId, appointment?.id])

  async function checkConflicts() {
    if (!selectedDate || !selectedTime || !selectedClientId) {
      setConflictError(null)
      return
    }

    const [hours, minutes] = selectedTime.split(':').map(Number)
    const scheduledAt = new Date(selectedDate)
    scheduledAt.setHours(hours, minutes, 0, 0)
    const endTime = new Date(
      scheduledAt.getTime() + selectedDuration * 60000
    )

    // Check for conflicts
    let query = (supabase
      .from('appointments') as any)
      .select('id, scheduled_at, duration_minutes')
      .eq('trainer_id', trainerId)
      .neq('status', 'cancelled')
    
    if (appointment?.id) {
      query = query.neq('id', appointment.id)
    }
    
    const { data } = await query
    const existing = data as Array<{ id: string; scheduled_at: string; duration_minutes: number }> | null

    if (existing) {
      const hasConflict = existing.some((apt) => {
        const aptStart = new Date(apt.scheduled_at)
        const aptEnd = new Date(
          aptStart.getTime() + apt.duration_minutes * 60000
        )

        return (
          (scheduledAt >= aptStart && scheduledAt < aptEnd) ||
          (endTime > aptStart && endTime <= aptEnd) ||
          (scheduledAt <= aptStart && endTime >= aptEnd)
        )
      })

      if (hasConflict) {
        setConflictError('This time slot conflicts with another appointment')
      } else {
        setConflictError(null)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (!selectedClientId) {
      toast.error('Please select a client')
      setLoading(false)
      return
    }

    if (conflictError) {
      toast.error(conflictError)
      setLoading(false)
      return
    }

    const [hours, minutes] = selectedTime.split(':').map(Number)
    const scheduledAt = new Date(selectedDate)
    scheduledAt.setHours(hours, minutes, 0, 0)

    const appointmentData = {
      trainer_id: trainerId,
      client_id: selectedClientId,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: selectedDuration,
      status,
      notes: notes || null,
    }

    try {
      let savedAppointmentId: string | null = null
      let isCancellation = false
      let isUpdate = false

      if (appointment) {
        // Editing - no recurring support for edits
        isUpdate = true
        isCancellation = status === 'cancelled' && appointment.status !== 'cancelled'
        
        const { error, data } = await (supabase
          .from('appointments') as any)
          .update(appointmentData)
          .eq('id', appointment.id)
          .select()
          .single()

        if (error) throw error
        savedAppointmentId = data?.id || appointment.id
        toast.success('Appointment updated successfully!')
      } else {
        // Creating - support recurring appointments
        if (isRecurring && numberOfOccurrences > 1) {
          // Create multiple appointments
          const appointmentsToCreate = []
          let currentDate = new Date(scheduledAt)

          for (let i = 0; i < numberOfOccurrences; i++) {
            const appointmentDate = new Date(currentDate)
            appointmentDate.setHours(hours, minutes, 0, 0)

            appointmentsToCreate.push({
              ...appointmentData,
              scheduled_at: appointmentDate.toISOString(),
            })

            // Calculate next date based on frequency
            switch (recurrenceFrequency) {
              case 'daily':
                currentDate = addDays(currentDate, 1)
                break
              case 'weekly':
                currentDate = addWeeks(currentDate, 1)
                break
              case 'bi-weekly':
                currentDate = addWeeks(currentDate, 2)
                break
              case 'monthly':
                currentDate = addMonths(currentDate, 1)
                break
            }
          }

          const { error, data } = await (supabase
            .from('appointments') as any)
            .insert(appointmentsToCreate)
            .select()

          if (error) throw error
          
          // Send confirmation emails for all recurring appointments
          if (data && Array.isArray(data)) {
            for (const apt of data) {
              try {
                await fetch('/api/appointments/send-confirmation', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    appointmentId: apt.id,
                    emailType: 'confirmation',
                  }),
                })
              } catch (emailError) {
                // Silently fail - don't block the flow
                console.error('Failed to send confirmation email:', emailError)
              }
            }
          }
          
          toast.success(`Created ${appointmentsToCreate.length} recurring appointments successfully!`)
        } else {
          // Single appointment
          const { error, data } = await (supabase
            .from('appointments') as any)
            .insert(appointmentData)
            .select()
            .single()

          if (error) throw error
          savedAppointmentId = data?.id
          toast.success('Appointment created successfully!')
        }
      }

      // Send confirmation email (non-blocking)
      if (savedAppointmentId) {
        try {
          let emailType = 'confirmation'
          if (isCancellation) {
            emailType = 'cancellation'
          } else if (isUpdate) {
            emailType = 'update'
          }

          const response = await fetch('/api/appointments/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              appointmentId: savedAppointmentId,
              emailType,
              ...(isCancellation && notes ? { cancellationReason: notes } : {}),
            }),
          })

          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              toast.success('Confirmation email sent to client!', { duration: 3000 })
            }
          }
        } catch (emailError) {
          // Silently fail - don't block the flow
          console.error('Failed to send confirmation email:', emailError)
        }
      }

      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save appointment')
    } finally {
      setLoading(false)
    }
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Client *
        </label>
        {clients.length === 0 ? (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
              No clients found. Please create a client first.
            </p>
            <a
              href="/clients/new"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Create a new client →
            </a>
          </div>
        ) : (
          <>
            <div className="relative">
              <input
                type="text"
                placeholder="Search clients..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                onFocus={() => {
                  if (!clientSearch && clients.length > 0) {
                    setClientSearch('')
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800"
              />
              {(clientSearch || (!selectedClientId && clients.length > 0)) && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg dark:shadow-slate-900/50 max-h-60 overflow-auto">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        setSelectedClientId(client.id)
                        setClientSearch(client.name)
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors text-gray-900 dark:text-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        {client.photo_url ? (
                          <img
                            src={client.photo_url}
                            alt={client.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                            {client.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium">{client.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedClient && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Selected:</span>
                <span className="font-medium text-gray-900 dark:text-slate-100 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">
                  {selectedClient.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClientId('')
                    setClientSearch('')
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                >
                  Change
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Date Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date *
        </label>
        <input
          type="date"
          value={format(selectedDate, 'yyyy-MM-dd')}
          onChange={(e) => {
            // Fix: Parse date string as local date to avoid timezone issues
            // e.target.value is in format 'yyyy-MM-dd', parse it as local date
            const [year, month, day] = e.target.value.split('-').map(Number)
            const newDate = new Date(year, month - 1, day)
            if (!isNaN(newDate.getTime())) {
              setSelectedDate(newDate)
            }
          }}
          min={format(new Date(), 'yyyy-MM-dd')}
          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg shadow-sm hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-gray-900 dark:text-slate-100"
        />
      </div>

      {/* Time and Duration */}
      <TimeSlotPicker
        selectedTime={selectedTime}
        selectedDuration={selectedDuration}
        onTimeChange={setSelectedTime}
        onDurationChange={setSelectedDuration}
        selectedDate={selectedDate}
      />

      {/* Status (only for editing) */}
      {appointment && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value as
                  | 'scheduled'
                  | 'completed'
                  | 'cancelled'
                  | 'no_show'
              )
            }
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800"
          >
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
      )}

      {/* Recurring Appointment (only for new appointments) */}
      {!appointment && (
        <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:bg-slate-800"
            />
            <label htmlFor="isRecurring" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Recurring appointment
            </label>
          </div>

          {isRecurring && (
            <div className="space-y-3 pl-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequency
                </label>
                <select
                  value={recurrenceFrequency}
                  onChange={(e) => setRecurrenceFrequency(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Occurrences
                </label>
                <input
                  type="number"
                  min="2"
                  max="52"
                  value={numberOfOccurrences}
                  onChange={(e) => setNumberOfOccurrences(parseInt(e.target.value) || 2)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {numberOfOccurrences} appointments will be created
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 resize-none text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800"
          placeholder="Add any notes about this appointment..."
        />
      </div>

      {/* Conflict Error */}
      {conflictError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-sm text-orange-800 dark:text-orange-200"
        >
          {conflictError}
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading || !!conflictError || !selectedClientId}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          {loading
            ? 'Saving...'
            : appointment
            ? 'Update Appointment'
            : 'Create Appointment'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}


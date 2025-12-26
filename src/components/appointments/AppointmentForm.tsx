'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, addDays, addWeeks, addMonths } from 'date-fns'
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
}

export default function AppointmentForm({
  trainerId,
  appointment,
  clients,
  onSuccess,
  onCancel,
}: AppointmentFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    appointment ? new Date(appointment.scheduled_at) : new Date()
  )
  const [selectedTime, setSelectedTime] = useState<string>(
    appointment
      ? format(new Date(appointment.scheduled_at), 'HH:mm')
      : '09:00'
  )
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

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:75',message:'Clients filter check',data:{clientsCount:clients.length,filteredCount:filteredClients.length,clientSearch},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  }, [clients.length, filteredClients.length, clientSearch]);
  // #endregion

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

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:111',message:'handleSubmit called',data:{hasClientId:!!selectedClientId,hasConflictError:!!conflictError,selectedDate:selectedDate?.toISOString(),selectedTime,selectedDuration},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!selectedClientId) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:115',message:'Validation failed - no client',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      toast.error('Please select a client')
      setLoading(false)
      return
    }

    if (conflictError) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:121',message:'Validation failed - conflict',data:{conflictError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:131',message:'Before Supabase insert',data:{appointmentData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    try {
      if (appointment) {
        // Editing - no recurring support for edits
        const { error } = await (supabase
          .from('appointments') as any)
          .update(appointmentData)
          .eq('id', appointment.id)

        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:142',message:'After Supabase update',data:{hasError:!!error,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        if (error) throw error
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
          toast.success(`Created ${appointmentsToCreate.length} recurring appointments successfully!`)
        } else {
          // Single appointment
          const { error, data } = await (supabase
            .from('appointments') as any)
            .insert(appointmentData)
            .select()

          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:150',message:'After Supabase insert',data:{hasError:!!error,errorMessage:error?.message,hasData:!!data,insertedId:data?.[0]?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion

          if (error) throw error
          toast.success('Appointment created successfully!')
        }
      }

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:158',message:'Before onSuccess callback',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      onSuccess()

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:163',message:'After onSuccess callback',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:159',message:'Error in handleSubmit',data:{errorMessage:error?.message,errorString:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      toast.error(error.message || 'Failed to save appointment')
    } finally {
      setLoading(false)
    }
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:200',message:'AppointmentForm render',data:{clientsCount:clients.length,hasSelectedClientId:!!selectedClientId,selectedClientId,hasConflictError:!!conflictError,loading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  }, [clients.length, selectedClientId, conflictError, loading]);
  // #endregion

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Client *
        </label>
        {clients.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">
              No clients found. Please create a client first.
            </p>
            <a
              href="/clients/new"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
              {(clientSearch || (!selectedClientId && clients.length > 0)) && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        // #region agent log
                        fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentForm.tsx:235',message:'Client selected',data:{clientId:client.id,clientName:client.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                        // #endregion
                        setSelectedClientId(client.id)
                        setClientSearch(client.name)
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors text-gray-900"
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
                <span className="text-gray-600">Selected:</span>
                <span className="font-medium text-gray-900 bg-blue-50 px-3 py-1 rounded-lg">
                  {selectedClient.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClientId('')
                    setClientSearch('')
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date *
        </label>
        <input
          type="date"
          value={format(selectedDate, 'yyyy-MM-dd')}
          onChange={(e) => {
            const newDate = new Date(e.target.value)
            if (!isNaN(newDate.getTime())) {
              setSelectedDate(newDate)
            }
          }}
          min={format(new Date(), 'yyyy-MM-dd')}
          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
        />
      </div>

      {/* Time and Duration */}
      <TimeSlotPicker
        selectedTime={selectedTime}
        selectedDuration={selectedDuration}
        onTimeChange={setSelectedTime}
        onDurationChange={setSelectedDuration}
      />

      {/* Status (only for editing) */}
      {appointment && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
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
        <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isRecurring" className="ml-2 text-sm font-medium text-gray-700">
              Recurring appointment
            </label>
          </div>

          {isRecurring && (
            <div className="space-y-3 pl-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  value={recurrenceFrequency}
                  onChange={(e) => setRecurrenceFrequency(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Occurrences
                </label>
                <input
                  type="number"
                  min="2"
                  max="52"
                  value={numberOfOccurrences}
                  onChange={(e) => setNumberOfOccurrences(parseInt(e.target.value) || 2)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {numberOfOccurrences} appointments will be created
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 bg-white"
          placeholder="Add any notes about this appointment..."
        />
      </div>

      {/* Conflict Error */}
      {conflictError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800"
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
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}


'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Database } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'

type Appointment = Database['public']['Tables']['appointments']['Row']
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update']
type Client = Database['public']['Tables']['clients']['Row']

const statusColors = {
  scheduled: 'bg-gradient-to-r from-blue-500 to-blue-600',
  completed: 'bg-gradient-to-r from-green-500 to-green-600',
  cancelled: 'bg-gray-400 dark:bg-gray-600',
  no_show: 'bg-gradient-to-r from-orange-500 to-orange-600',
}

const statusLabels = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

export default function AppointmentDetailPage({
  appointment,
  client,
}: {
  appointment: Appointment
  client: Client
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()


  const scheduledDate = new Date(appointment.scheduled_at)
  const endTime = new Date(
    scheduledDate.getTime() + appointment.duration_minutes * 60000
  )

  async function updateStatus(
    newStatus: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  ) {
    setLoading(true)
    try {
      const { error } = await (supabase
        .from('appointments') as any)
        .update({ status: newStatus })
        .eq('id', appointment.id)

      if (error) throw error

      toast.success(`Appointment marked as ${statusLabels[newStatus]}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointment.id)

      if (error) throw error

      toast.success('Appointment deleted')
      router.push('/appointments')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete appointment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 mb-4 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Appointments
            </button>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-slate-100">Appointment Details</h1>
          </div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Status Header */}
            <div
              className={`h-2 ${statusColors[appointment.status]}`}
            />

            <div className="p-6 md:p-8">
              {/* Client Info */}
              <div className="flex items-start gap-6 mb-8 pb-8 border-b border-gray-200 dark:border-slate-700">
                {client.photo_url ? (
                  <img
                    src={client.photo_url}
                    alt={client.name}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100 dark:ring-slate-700"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-4 ring-gray-100 dark:ring-slate-700">
                    <span className="text-white font-bold text-2xl">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <Link
                    href={`/clients/${client.id}`}
                    className="text-2xl font-bold text-gray-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {client.name}
                  </Link>
                  {client.email && (
                    <p className="text-gray-600 dark:text-slate-400 mt-1">{client.email}</p>
                  )}
                  {client.phone && (
                    <p className="text-gray-600 dark:text-slate-400">{client.phone}</p>
                  )}
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium text-white ${statusColors[appointment.status]}`}
                >
                  {statusLabels[appointment.status]}
                </span>
              </div>

              {/* Appointment Details */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1 block">
                    Date & Time
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    {format(scheduledDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-gray-600 dark:text-slate-400">
                    {format(scheduledDate, 'h:mm a')} - {format(endTime, 'h:mm a')}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1 block">
                    Duration
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    {appointment.duration_minutes} minutes
                  </p>
                </div>

                {appointment.notes && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1 block">
                      Notes
                    </label>
                    <p className="text-gray-900 dark:text-slate-100 whitespace-pre-wrap bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
                      {appointment.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200 dark:border-slate-700">
                <Link
                  href={`/appointments/${appointment.id}/edit`}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Edit Appointment
                </Link>

                {appointment.status === 'scheduled' && (
                  <>
                    <button
                      onClick={() => updateStatus('completed')}
                      disabled={loading}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Mark as Completed
                    </button>
                    <button
                      onClick={() => updateStatus('cancelled')}
                      disabled={loading}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Cancel Appointment
                    </button>
                  </>
                )}

                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}


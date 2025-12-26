'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Database } from '@/types/database.types'
import BackButton from '@/components/layout/BackButton'
import toast from 'react-hot-toast'
import AssignWorkoutModal from '@/components/workouts/AssignWorkoutModal'

type Client = Database['public']['Tables']['clients']['Row']
type Appointment = Database['public']['Tables']['appointments']['Row']
type Invoice = Database['public']['Tables']['invoices']['Row']
type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row'] & {
  workouts?: {
    id: string
    name: string
    description: string | null
  } | null
}

interface ClientDetailPageProps {
  client: Client
  appointments: Appointment[]
  invoices: Invoice[]
  trainerId: string
  workoutSessions: WorkoutSession[]
}

export default function ClientDetailPage({
  client,
  appointments,
  invoices,
  trainerId,
  workoutSessions,
}: ClientDetailPageProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [showAssignWorkoutModal, setShowAssignWorkoutModal] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const { error } = await supabase.from('clients').delete().eq('id', client.id)

    if (error) {
      toast.error('Failed to delete client')
      setDeleting(false)
    } else {
      toast.success('Client deleted successfully')
      router.push('/clients')
      router.refresh()
    }
  }

  return (
    <>
      <BackButton href="/clients" />
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            {client.photo_url ? (
              <img
                src={client.photo_url}
                alt={client.name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100 dark:ring-slate-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ring-4 ring-gray-100 dark:ring-slate-700">
                <span className="text-white text-2xl font-bold">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-1">{client.name}</h1>
              {client.email && (
                <p className="text-gray-600 dark:text-slate-400">{client.email}</p>
              )}
              {client.phone && (
                <p className="text-gray-600 dark:text-slate-400">{client.phone}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/clients/${client.id}/edit`}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Goals */}
            {client.goals && (
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">Goals</h2>
                <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{client.goals}</p>
              </div>
            )}

            {/* Notes */}
            {client.notes && (
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">Notes</h2>
                <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}

            {/* Medical Notes */}
            {client.medical_notes && (
              <div className="bg-red-50 dark:bg-red-900/30 rounded-2xl shadow-sm dark:shadow-slate-900/50 border border-red-200 dark:border-red-800/50 p-6">
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-3">Medical Notes</h2>
                <p className="text-red-800 dark:text-red-200 whitespace-pre-wrap">{client.medical_notes}</p>
              </div>
            )}

            {/* Workout History */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Workout History</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAssignWorkoutModal(true)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Assign Workout
                  </button>
                  <Link
                    href={`/clients/${client.id}/workouts`}
                    className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 font-medium"
                  >
                    View All
                  </Link>
                </div>
              </div>
              {workoutSessions.length === 0 ? (
                <p className="text-gray-500 dark:text-slate-400 text-sm">No workouts assigned yet</p>
              ) : (
                <div className="space-y-3">
                  {workoutSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-3 border border-gray-200 dark:border-slate-700/50 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-slate-100">
                            {session.workouts?.name || 'Unknown Workout'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            {format(new Date(session.completed_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Appointments */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Recent Appointments</h2>
                <Link
                  href={`/appointments/new?clientId=${client.id}`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Schedule New
                </Link>
              </div>
              {appointments.length === 0 ? (
                <p className="text-gray-500 dark:text-slate-400 text-sm">No appointments yet</p>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <Link
                      key={apt.id}
                      href={`/appointments/${apt.id}`}
                      className="block p-3 border border-gray-200 dark:border-slate-700/50 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-slate-100">
                            {format(new Date(apt.scheduled_at), 'MMM d, yyyy h:mm a')}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            {apt.duration_minutes} minutes • {apt.status}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            apt.status === 'scheduled'
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                              : apt.status === 'completed'
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                              : apt.status === 'cancelled'
                              ? 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200'
                              : 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Quick Info</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Created</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    {format(new Date(client.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Total Appointments</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{appointments.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Total Invoices</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{invoices.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Workouts Completed</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{workoutSessions.length}</p>
                </div>
              </div>
            </div>

            {/* Recent Invoices */}
            {invoices.length > 0 && (
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Recent Invoices</h2>
                <div className="space-y-3">
                  {invoices.slice(0, 5).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="block p-3 border border-gray-200 dark:border-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-slate-100">
                            ${invoice.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                              : invoice.status === 'overdue'
                              ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                              : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Workout Modal */}
      <AssignWorkoutModal
        isOpen={showAssignWorkoutModal}
        onClose={() => setShowAssignWorkoutModal(false)}
        trainerId={trainerId}
        clientId={client.id}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </>
  )
}


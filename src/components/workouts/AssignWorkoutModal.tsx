'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

type Workout = Database['public']['Tables']['workouts']['Row']
type Client = Database['public']['Tables']['clients']['Row']

interface AssignWorkoutModalProps {
  isOpen: boolean
  onClose: () => void
  trainerId: string
  clientId?: string // If provided, pre-select this client
  workoutId?: string // If provided, pre-select this workout
  onSuccess?: () => void
}

export default function AssignWorkoutModal({
  isOpen,
  onClose,
  trainerId,
  clientId: initialClientId,
  workoutId: initialWorkoutId,
  onSuccess,
}: AssignWorkoutModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || '')
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>(initialWorkoutId || '')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, trainerId])

  async function loadData() {
    setLoadingData(true)
    try {
      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('trainer_id', trainerId)
        .order('name', { ascending: true })

      if (clientsError) throw clientsError
      setClients(clientsData || [])

      // Load workouts
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('trainer_id', trainerId)
        .order('name', { ascending: true })

      if (workoutsError) throw workoutsError
      setWorkouts(workoutsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClientId || !selectedWorkoutId) {
      toast.error('Please select both a client and a workout')
      return
    }

    setLoading(true)

    try {
      // Get the selected workout to copy exercises
      const selectedWorkout = workouts.find((w) => w.id === selectedWorkoutId)
      if (!selectedWorkout) {
        toast.error('Workout not found')
        return
      }

      // Create workout session
      const { error } = await supabase.from('workout_sessions').insert({
        trainer_id: trainerId,
        client_id: selectedClientId,
        workout_id: selectedWorkoutId,
        exercises_completed: selectedWorkout.exercises || [],
        notes: notes || null,
        completed_at: new Date().toISOString(),
      })

      if (error) throw error

      toast.success('Workout assigned successfully!')
      setSelectedClientId('')
      setSelectedWorkoutId('')
      setNotes('')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Error assigning workout:', error)
      toast.error(error.message || 'Failed to assign workout')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-800/95 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Assign Workout</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Select Client *
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700"
                    required
                  >
                    <option value="">Choose a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Workout Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Select Workout *
                  </label>
                  <select
                    value={selectedWorkoutId}
                    onChange={(e) => setSelectedWorkoutId(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700"
                    required
                  >
                    <option value="">Choose a workout...</option>
                    {workouts.map((workout) => (
                      <option key={workout.id} value={workout.id}>
                        {workout.name} {workout.is_template && '(Template)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 resize-none"
                    placeholder="Add any notes about this workout session..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedClientId || !selectedWorkoutId}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Assigning...' : 'Assign Workout'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}


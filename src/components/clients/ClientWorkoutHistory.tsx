'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Database } from '@/types/database.types'
import BackButton from '@/components/layout/BackButton'
import AssignWorkoutModal from '@/components/workouts/AssignWorkoutModal'
import { useRouter } from 'next/navigation'

type Client = Database['public']['Tables']['clients']['Row']
type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row'] & {
  workouts?: {
    id: string
    name: string
    description: string | null
    exercises: any
  } | null
}

interface ClientWorkoutHistoryProps {
  client: Client
  trainerId: string
  workoutSessions: WorkoutSession[]
}

export default function ClientWorkoutHistory({
  client,
  trainerId,
  workoutSessions,
}: ClientWorkoutHistoryProps) {
  const router = useRouter()
  const [showAssignWorkoutModal, setShowAssignWorkoutModal] = useState(false)

  return (
    <>
      <BackButton href={`/clients/${client.id}`} />
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Workout History - {client.name}
            </h1>
            <p className="text-sm lg:text-base text-gray-600">
              View and manage all workouts assigned to this client
            </p>
          </div>
          <button
            onClick={() => setShowAssignWorkoutModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Assign Workout</span>
          </button>
        </div>

        {workoutSessions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No workouts yet</h3>
            <p className="text-gray-500 mb-6">Start by assigning a workout to this client</p>
            <button
              onClick={() => setShowAssignWorkoutModal(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Assign First Workout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {workoutSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {session.workouts?.name || 'Unknown Workout'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Completed on {format(new Date(session.completed_at), 'MMMM d, yyyy')} at{' '}
                      {format(new Date(session.completed_at), 'h:mm a')}
                    </p>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                </div>

                {session.workouts?.description && (
                  <p className="text-gray-600 mb-4">{session.workouts.description}</p>
                )}

                {/* Exercises */}
                {session.exercises_completed && Array.isArray(session.exercises_completed) && session.exercises_completed.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Exercises Completed</h4>
                    <div className="space-y-2">
                      {session.exercises_completed.map((exercise: any, index: number) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">{exercise.name}</span>
                            {exercise.sets && exercise.reps && (
                              <span className="text-sm text-gray-600">
                                {exercise.sets} sets × {exercise.reps} reps
                              </span>
                            )}
                          </div>
                          {exercise.weight && (
                            <p className="text-sm text-gray-600">Weight: {exercise.weight} lbs</p>
                          )}
                          {exercise.notes && (
                            <p className="text-sm text-gray-500 mt-1">{exercise.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {session.notes && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Notes: </span>
                      {session.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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



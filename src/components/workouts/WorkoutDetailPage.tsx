'use client'

import { Database } from '@/types/database.types'
import Link from 'next/link'
import { format } from 'date-fns'
import BackButton from '@/components/layout/BackButton'

type Workout = Database['public']['Tables']['workouts']['Row']

interface WorkoutDetailPageProps {
  workout: Workout
  trainerId: string
}

export default function WorkoutDetailPage({ workout, trainerId }: WorkoutDetailPageProps) {
  const exercises = Array.isArray(workout.exercises) ? workout.exercises : []


  return (
    <>
      <BackButton href="/workouts" />
      <div className="max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                {workout.name}
              </h1>
              {workout.is_template && (
                <span className="inline-block px-3 py-1 text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 text-purple-700 dark:text-purple-300 rounded-full">
                  Template
                </span>
              )}
            </div>
            <Link
              href={`/workouts/${workout.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Edit
            </Link>
          </div>
          {workout.description && (
            <p className="text-gray-600 dark:text-slate-400 mb-4">
              {workout.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
            <span>
              Created {format(new Date(workout.created_at), 'MMM d, yyyy')}
            </span>
            <span>•</span>
            <span>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-xl shadow-xl dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-6">
            Exercises
          </h2>

          {exercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              No exercises in this workout
            </div>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise: any, index: number) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-slate-700/50 rounded-lg p-5 bg-gray-50 dark:bg-slate-700/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                        {exercise.name || `Exercise ${index + 1}`}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {exercise.sets && (
                      <div>
                        <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Sets</span>
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{exercise.sets}</p>
                      </div>
                    )}
                    {exercise.reps && (
                      <div>
                        <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Reps</span>
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{exercise.reps}</p>
                      </div>
                    )}
                    {exercise.weight && (
                      <div>
                        <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Weight</span>
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{exercise.weight} kg</p>
                      </div>
                    )}
                    {exercise.rest && (
                      <div>
                        <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Rest</span>
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{exercise.rest}s</p>
                      </div>
                    )}
                    {exercise.duration && (
                      <div>
                        <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Duration</span>
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{exercise.duration} min</p>
                      </div>
                    )}
                  </div>

                  {exercise.notes && (
                    <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                      <p className="text-sm text-gray-700 dark:text-slate-300">
                        <span className="font-semibold">Notes: </span>
                        {exercise.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/layout/BackButton'
import ExerciseLibrary, { Exercise as LibraryExercise } from './ExerciseLibrary'
import { Database } from '@/types/database.types'

type Workout = Database['public']['Tables']['workouts']['Row']

type Exercise = {
  name: string
  sets?: number
  reps?: number
  weight?: number
  duration?: number
  rest?: number
  notes?: string
}

export default function EditWorkoutForm({ workout, trainerId }: { workout: Workout; trainerId: string }) {
  const [name, setName] = useState(workout.name || '')
  const [description, setDescription] = useState(workout.description || '')
  const [isTemplate, setIsTemplate] = useState(workout.is_template || false)
  const [exercises, setExercises] = useState<Exercise[]>(
    Array.isArray(workout.exercises) ? (workout.exercises as Exercise[]) : []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const addExercise = () => {
    setExercises([...exercises, { name: '' }])
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
  }

  const handleSelectFromLibrary = (libraryExercise: LibraryExercise) => {
    const newExercise: Exercise = {
      name: libraryExercise.name,
      sets: 3,
      reps: 10,
    }
    setExercises([...exercises, newExercise])
    toast.success(`Added ${libraryExercise.name} to workout`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!name.trim()) {
      setError('Workout name is required')
      setLoading(false)
      return
    }

    // Filter out exercises with empty names
    const validExercises = exercises.filter((ex) => ex.name.trim())

    const { error: updateError } = await (supabase.from('workouts') as any)
      .update({
        name: name.trim(),
        description: description.trim() || null,
        exercises: validExercises,
        is_template: isTemplate,
      })
      .eq('id', workout.id)

    if (updateError) {
      setError(updateError.message)
      toast.error('Failed to update workout')
      setLoading(false)
    } else {
      toast.success('Workout updated successfully!')
      router.push(`/workouts/${workout.id}`)
      router.refresh()
    }
  }

  const handleCancel = () => {
    router.push(`/workouts/${workout.id}`)
  }

  return (
    <>
      <BackButton href={`/workouts/${workout.id}`} />
      <div className="max-w-4xl">
        <div className="mb-5">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-1">Edit Workout</h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-slate-400">
            Update your workout plan with exercises, sets, reps, and more
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-xl shadow-xl dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-5 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4">
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Workout Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Workout Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Upper Body Strength"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this workout..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 resize-none"
              />
            </div>

            {/* Template Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isTemplate"
                checked={isTemplate}
                onChange={(e) => setIsTemplate(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:bg-slate-700"
              />
              <label htmlFor="isTemplate" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                Save as template (can be reused for multiple clients)
              </label>
            </div>

            {/* Exercises Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Exercises
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowExerciseLibrary(!showExerciseLibrary)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all hover:scale-105 active:scale-95 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {showExerciseLibrary ? 'Hide' : 'Browse'} Library
                  </button>
                  <button
                    type="button"
                    onClick={addExercise}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Exercise
                  </button>
                </div>
              </div>

              {/* Exercise Library */}
              {showExerciseLibrary && (
                <div className="mb-6">
                  <ExerciseLibrary
                    onSelectExercise={handleSelectFromLibrary}
                    selectedExercises={exercises.map(e => e.name)}
                  />
                </div>
              )}

              {exercises.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800/50 dark:to-slate-900/50"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-slate-400 mb-3 font-medium">No exercises added yet</p>
                  <button
                    type="button"
                    onClick={addExercise}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add your first exercise
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {exercises.map((exercise, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="group relative border border-gray-200 dark:border-slate-700/50 rounded-xl p-5 bg-white dark:bg-slate-800/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600/50"
                      >
                        {/* Exercise Number Badge */}
                        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                          {index + 1}
                        </div>

                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1">
                              Exercise {index + 1}
                            </h4>
                            {exercise.name && (
                              <p className="text-xs text-gray-500 dark:text-slate-400 italic">
                                {exercise.name}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExercise(index)}
                            className="p-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove exercise"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* Exercise Name - Full Width */}
                        <div className="mb-4">
                          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Exercise Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={exercise.name}
                            onChange={(e) => updateExercise(index, 'name', e.target.value)}
                            placeholder="e.g., Bench Press, Squat, Running..."
                            className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 text-sm transition-all"
                          />
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <div className="relative">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                              </svg>
                              Sets
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={exercise.sets || ''}
                              onChange={(e) =>
                                updateExercise(
                                  index,
                                  'sets',
                                  e.target.value ? parseInt(e.target.value) : 0
                                )
                              }
                              placeholder="3"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 text-sm"
                            />
                          </div>

                          <div className="relative">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Reps
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={exercise.reps || ''}
                              onChange={(e) =>
                                updateExercise(
                                  index,
                                  'reps',
                                  e.target.value ? parseInt(e.target.value) : 0
                                )
                              }
                              placeholder="10"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 text-sm"
                            />
                          </div>

                          <div className="relative">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              Weight (kg)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={exercise.weight || ''}
                              onChange={(e) =>
                                updateExercise(
                                  index,
                                  'weight',
                                  e.target.value ? parseFloat(e.target.value) : 0
                                )
                              }
                              placeholder="20"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 text-sm"
                            />
                          </div>

                          <div className="relative">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Rest (sec)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={exercise.rest || ''}
                              onChange={(e) =>
                                updateExercise(
                                  index,
                                  'rest',
                                  e.target.value ? parseInt(e.target.value) : 0
                                )
                              }
                              placeholder="60"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 text-sm"
                            />
                          </div>
                        </div>

                        {/* Duration and Notes Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Duration (min)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={exercise.duration || ''}
                              onChange={(e) =>
                                updateExercise(
                                  index,
                                  'duration',
                                  e.target.value ? parseInt(e.target.value) : 0
                                )
                              }
                              placeholder="30"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 text-sm"
                            />
                          </div>

                          <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Notes
                            </label>
                            <textarea
                              value={exercise.notes || ''}
                              onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                              placeholder="Add instructions or notes..."
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 text-sm resize-none"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-slate-700/30">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Workout'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}


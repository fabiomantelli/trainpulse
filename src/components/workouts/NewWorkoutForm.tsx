'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast'
import BackButton from '@/components/layout/BackButton'
import ExerciseLibrary, { Exercise as LibraryExercise } from './ExerciseLibrary'

type Exercise = {
  name: string
  sets?: number
  reps?: number
  weight?: number
  duration?: number
  rest?: number
  notes?: string
}

export default function NewWorkoutForm({ trainerId }: { trainerId: string }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isTemplate, setIsTemplate] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
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

    const { error: insertError } = await supabase.from('workouts').insert({
      trainer_id: trainerId,
      name: name.trim(),
      description: description.trim() || null,
      exercises: validExercises,
      is_template: isTemplate,
    })

    if (insertError) {
      setError(insertError.message)
      toast.error('Failed to create workout')
      setLoading(false)
    } else {
      toast.success('Workout created successfully!')
      router.push('/workouts')
      router.refresh()
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <>
      <Toaster position="top-right" />
      <BackButton href="/workouts" />
      <div className="max-w-4xl">
        <div className="mb-5">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-1">Create New Workout</h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-slate-400">
            Build a workout plan with exercises, sets, reps, and more
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
                      className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      {showExerciseLibrary ? 'Hide' : 'Browse'} Library
                    </button>
                    <button
                      type="button"
                      onClick={addExercise}
                      className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      + Add Exercise
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
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg">
                    <p className="text-gray-500 dark:text-slate-400 mb-2">No exercises added yet</p>
                    <button
                      type="button"
                      onClick={addExercise}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                      Add your first exercise
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {exercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-slate-700/30 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/30"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300">
                            Exercise {index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeExercise(index)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                              Exercise Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={exercise.name}
                              onChange={(e) => updateExercise(index, 'name', e.target.value)}
                              placeholder="e.g., Bench Press"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                              Duration (minutes)
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                              Rest (seconds)
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 text-sm"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Notes
                          </label>
                          <textarea
                            value={exercise.notes || ''}
                            onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                            placeholder="Add any notes or instructions..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 text-sm resize-none"
                          />
                        </div>
                      </div>
                    ))}
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
                  {loading ? 'Creating...' : 'Create Workout'}
                </button>
              </div>
            </form>
          </div>
        </div>
    </>
  )
}


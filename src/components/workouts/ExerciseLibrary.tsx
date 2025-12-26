'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export interface Exercise {
  name: string
  category: string
  muscleGroups: string[]
  description?: string
}

const EXERCISE_LIBRARY: Exercise[] = [
  // Chest
  { name: 'Bench Press', category: 'Chest', muscleGroups: ['Chest', 'Triceps', 'Shoulders'], description: 'Classic chest exercise using barbell' },
  { name: 'Push-ups', category: 'Chest', muscleGroups: ['Chest', 'Triceps', 'Shoulders'], description: 'Bodyweight chest exercise' },
  { name: 'Dumbbell Flyes', category: 'Chest', muscleGroups: ['Chest'], description: 'Isolation exercise for chest' },
  { name: 'Incline Bench Press', category: 'Chest', muscleGroups: ['Upper Chest', 'Shoulders'], description: 'Targets upper chest' },
  { name: 'Cable Crossover', category: 'Chest', muscleGroups: ['Chest'], description: 'Cable machine exercise' },
  
  // Back
  { name: 'Pull-ups', category: 'Back', muscleGroups: ['Lats', 'Biceps', 'Rhomboids'], description: 'Bodyweight back exercise' },
  { name: 'Barbell Row', category: 'Back', muscleGroups: ['Lats', 'Rhomboids', 'Biceps'], description: 'Compound back exercise' },
  { name: 'Lat Pulldown', category: 'Back', muscleGroups: ['Lats', 'Biceps'], description: 'Cable machine exercise' },
  { name: 'Deadlift', category: 'Back', muscleGroups: ['Back', 'Glutes', 'Hamstrings'], description: 'Full body compound movement' },
  { name: 'T-Bar Row', category: 'Back', muscleGroups: ['Lats', 'Rhomboids'], description: 'Back width builder' },
  
  // Shoulders
  { name: 'Overhead Press', category: 'Shoulders', muscleGroups: ['Shoulders', 'Triceps'], description: 'Standing shoulder press' },
  { name: 'Lateral Raises', category: 'Shoulders', muscleGroups: ['Shoulders'], description: 'Isolation for side delts' },
  { name: 'Front Raises', category: 'Shoulders', muscleGroups: ['Shoulders'], description: 'Targets front delts' },
  { name: 'Rear Delt Flyes', category: 'Shoulders', muscleGroups: ['Shoulders'], description: 'Posterior deltoids' },
  { name: 'Arnold Press', category: 'Shoulders', muscleGroups: ['Shoulders'], description: 'Rotating shoulder press' },
  
  // Arms
  { name: 'Bicep Curls', category: 'Arms', muscleGroups: ['Biceps'], description: 'Classic bicep exercise' },
  { name: 'Tricep Dips', category: 'Arms', muscleGroups: ['Triceps'], description: 'Bodyweight tricep exercise' },
  { name: 'Hammer Curls', category: 'Arms', muscleGroups: ['Biceps', 'Forearms'], description: 'Neutral grip curls' },
  { name: 'Tricep Pushdown', category: 'Arms', muscleGroups: ['Triceps'], description: 'Cable tricep exercise' },
  { name: 'Preacher Curl', category: 'Arms', muscleGroups: ['Biceps'], description: 'Isolated bicep movement' },
  
  // Legs
  { name: 'Squats', category: 'Legs', muscleGroups: ['Quads', 'Glutes', 'Hamstrings'], description: 'King of leg exercises' },
  { name: 'Leg Press', category: 'Legs', muscleGroups: ['Quads', 'Glutes'], description: 'Machine leg exercise' },
  { name: 'Lunges', category: 'Legs', muscleGroups: ['Quads', 'Glutes'], description: 'Unilateral leg exercise' },
  { name: 'Romanian Deadlift', category: 'Legs', muscleGroups: ['Hamstrings', 'Glutes'], description: 'Hamstring focused' },
  { name: 'Leg Curls', category: 'Legs', muscleGroups: ['Hamstrings'], description: 'Isolation for hamstrings' },
  { name: 'Leg Extensions', category: 'Legs', muscleGroups: ['Quads'], description: 'Isolation for quads' },
  { name: 'Calf Raises', category: 'Legs', muscleGroups: ['Calves'], description: 'Calf development' },
  
  // Core
  { name: 'Plank', category: 'Core', muscleGroups: ['Core'], description: 'Isometric core exercise' },
  { name: 'Crunches', category: 'Core', muscleGroups: ['Core'], description: 'Basic ab exercise' },
  { name: 'Russian Twists', category: 'Core', muscleGroups: ['Core'], description: 'Rotational core work' },
  { name: 'Mountain Climbers', category: 'Core', muscleGroups: ['Core', 'Cardio'], description: 'Dynamic core exercise' },
  { name: 'Dead Bug', category: 'Core', muscleGroups: ['Core'], description: 'Core stability exercise' },
  
  // Cardio
  { name: 'Running', category: 'Cardio', muscleGroups: ['Cardio'], description: 'Steady state cardio' },
  { name: 'Rowing', category: 'Cardio', muscleGroups: ['Cardio', 'Back', 'Legs'], description: 'Full body cardio' },
  { name: 'Cycling', category: 'Cardio', muscleGroups: ['Cardio', 'Legs'], description: 'Low impact cardio' },
  { name: 'Burpees', category: 'Cardio', muscleGroups: ['Cardio', 'Full Body'], description: 'High intensity exercise' },
  { name: 'Jump Rope', category: 'Cardio', muscleGroups: ['Cardio', 'Calves'], description: 'Coordination and cardio' },
]

interface ExerciseLibraryProps {
  onSelectExercise: (exercise: Exercise) => void
  selectedExercises?: string[]
}

export default function ExerciseLibrary({ onSelectExercise, selectedExercises = [] }: ExerciseLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  
  const categories = ['All', ...Array.from(new Set(EXERCISE_LIBRARY.map(e => e.category)))]

  const filteredExercises = EXERCISE_LIBRARY.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.muscleGroups.some(mg => mg.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 lg:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Exercise Library</h3>
      
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
        />
      </div>

      {/* Category Filter */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Exercise List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredExercises.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No exercises found</p>
        ) : (
          filteredExercises.map((exercise) => {
            const isSelected = selectedExercises.includes(exercise.name)
            return (
              <motion.div
                key={exercise.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
                onClick={() => !isSelected && onSelectExercise(exercise)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{exercise.name}</h4>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {exercise.category}
                      </span>
                      {exercise.muscleGroups.map((mg) => (
                        <span
                          key={mg}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                        >
                          {mg}
                        </span>
                      ))}
                    </div>
                    {exercise.description && (
                      <p className="text-sm text-gray-600">{exercise.description}</p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="ml-4 flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}



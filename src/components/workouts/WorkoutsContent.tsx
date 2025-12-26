'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import Link from 'next/link'
import AssignWorkoutModal from './AssignWorkoutModal'

type Workout = Database['public']['Tables']['workouts']['Row']

export default function WorkoutsContent({ trainerId }: { trainerId: string }) {
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkoutsContent.tsx:10',message:'WorkoutsContent mount',data:{trainerId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }, [trainerId]);
  // #endregion

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null)
  
  // #region agent log
  let supabase;
  try {
    supabase = createClient();
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkoutsContent.tsx:18',message:'createClient called',data:{hasSupabase:!!supabase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  } catch (error) {
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkoutsContent.tsx:20',message:'createClient error',data:{errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    throw error;
  }
  const supabaseClient = supabase;
  // #endregion

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkoutsContent.tsx:28',message:'useEffect triggered',data:{trainerId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    loadWorkouts()
  }, [trainerId])

  async function loadWorkouts() {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkoutsContent.tsx:35',message:'loadWorkouts start',data:{trainerId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    try {
      const { data, error } = await supabaseClient
        .from('workouts')
        .select('*')
        .eq('trainer_id', trainerId)
        .order('created_at', { ascending: false })

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkoutsContent.tsx:44',message:'loadWorkouts result',data:{hasError:!!error,errorMessage:error?.message,workoutsCount:data?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (error) {
        console.error('Error loading workouts:', error)
      } else {
        setWorkouts(data || [])
      }
      setLoading(false)
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkoutsContent.tsx:53',message:'loadWorkouts exception',data:{errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('Unexpected error loading workouts:', error)
      setLoading(false)
    }
  }

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkoutsContent.tsx:60',message:'WorkoutsContent render',data:{loading,workoutsCount:workouts.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }, [loading, workouts.length]);
  // #endregion

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-slate-300">Loading workouts...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-start mb-5">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-1">Workouts</h1>
            <p className="text-sm text-gray-600 dark:text-slate-300">Manage your workout plans and templates</p>
          </div>
          <Link
            href="/workouts/new"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Workout</span>
          </Link>
        </div>

        {workouts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">No workouts yet</h3>
            <p className="text-gray-500 dark:text-slate-300 mb-4">Get started by creating your first workout plan</p>
            <Link
              href="/workouts/new"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Workout
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-4 lg:p-5 hover:shadow-xl dark:hover:shadow-slate-700/40 hover:border-blue-200 dark:hover:border-slate-600/50 transition-all duration-200 group"
              >
                <Link href={`/workouts/${workout.id}`} className="block">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {workout.name}
                    </h3>
                    {workout.is_template && (
                      <span className="px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 text-purple-700 dark:text-purple-300 rounded-full">
                        Template
                      </span>
                    )}
                  </div>
                  {workout.description && (
                    <p className="text-sm text-gray-600 dark:text-slate-300 mb-4 line-clamp-2">
                      {workout.description}
                    </p>
                  )}
                  <div className="flex items-center text-sm text-gray-500 dark:text-slate-400 mb-4">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {Array.isArray(workout.exercises)
                      ? `${workout.exercises.length} exercise${workout.exercises.length !== 1 ? 's' : ''}`
                      : '0 exercises'}
                  </div>
                </Link>
                <button
                  onClick={() => {
                    setSelectedWorkoutId(workout.id)
                    setAssignModalOpen(true)
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 text-sm"
                >
                  Assign to Client
                </button>
              </div>
            ))}
          </div>
        )}

      {/* Assign Workout Modal */}
      <AssignWorkoutModal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false)
          setSelectedWorkoutId(null)
        }}
        trainerId={trainerId}
        workoutId={selectedWorkoutId || undefined}
        onSuccess={() => {
          // Could refresh or show success message
        }}
      />
    </>
  )
}


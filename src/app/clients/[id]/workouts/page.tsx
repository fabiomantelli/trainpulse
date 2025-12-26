import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ClientWorkoutHistory from '@/components/clients/ClientWorkoutHistory'

export default async function ClientWorkoutsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Load client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .eq('trainer_id', user.id)
    .single()

  if (clientError || !client) {
    notFound()
  }

  // Load all workout sessions for this client
  const { data: workoutSessions } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      workouts (
        id,
        name,
        description,
        exercises
      )
    `)
    .eq('client_id', params.id)
    .order('completed_at', { ascending: false })

  return (
    <ClientWorkoutHistory
      client={client}
      trainerId={user.id}
      workoutSessions={workoutSessions || []}
    />
  )
}



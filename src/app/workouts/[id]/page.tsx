import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import WorkoutDetailPage from '@/components/workouts/WorkoutDetailPage'

export default async function WorkoutDetail({
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

  // Load workout
  const { data: workout, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', params.id)
    .eq('trainer_id', user.id)
    .single()

  if (error || !workout) {
    notFound()
  }

  return <WorkoutDetailPage workout={workout} trainerId={user.id} />
}


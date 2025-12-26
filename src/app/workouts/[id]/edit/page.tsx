import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EditWorkoutForm from '@/components/workouts/EditWorkoutForm'

export default async function EditWorkoutPage({
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

  return <EditWorkoutForm workout={workout} trainerId={user.id} />
}


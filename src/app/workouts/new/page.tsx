import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewWorkoutForm from '@/components/workouts/NewWorkoutForm'

export default async function NewWorkoutPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return <NewWorkoutForm trainerId={user.id} />
}



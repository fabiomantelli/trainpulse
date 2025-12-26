import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WorkoutsContent from '@/components/workouts/WorkoutsContent'

export default async function WorkoutsPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return <WorkoutsContent trainerId={user.id} />
}


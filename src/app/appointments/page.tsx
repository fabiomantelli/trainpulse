import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppointmentsContent from '@/components/appointments/AppointmentsContent'

export default async function AppointmentsPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return <AppointmentsContent trainerId={user.id} />
}


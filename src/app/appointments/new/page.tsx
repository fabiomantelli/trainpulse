import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewAppointmentPage from '@/components/appointments/NewAppointmentPage'

export default async function NewAppointment() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Load clients
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .eq('trainer_id', user.id)
    .order('name', { ascending: true })

  if (clientsError) {
    console.error('Error loading clients:', clientsError)
  }

  return <NewAppointmentPage trainerId={user.id} clients={clients || []} />
}


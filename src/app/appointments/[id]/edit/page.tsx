import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EditAppointmentPage from '@/components/appointments/EditAppointmentPage'

export default async function EditAppointment({
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

  // Load appointment
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', params.id)
    .eq('trainer_id', user.id)
    .single()

  if (error || !appointment) {
    notFound()
  }

  // Load clients
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('trainer_id', user.id)
    .order('name', { ascending: true })

  return (
    <EditAppointmentPage
      trainerId={user.id}
      appointment={appointment}
      clients={clients || []}
    />
  )
}



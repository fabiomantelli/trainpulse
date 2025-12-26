import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AppointmentDetailPage from '@/components/appointments/AppointmentDetailPage'

export default async function AppointmentDetail({
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
  const { data: appointment, error: aptError } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', params.id)
    .eq('trainer_id', user.id)
    .single()

  if (aptError || !appointment) {
    notFound()
  }

  // Load client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name, email, phone, photo_url')
    .eq('id', appointment.client_id)
    .single()

  if (clientError || !client) {
    notFound()
  }

  return (
    <AppointmentDetailPage
      appointment={appointment}
      client={client}
    />
  )
}


import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ClientDetailPage from '@/components/clients/ClientDetailPage'

export default async function ClientDetail({
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

  // Load client appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('client_id', params.id)
    .order('scheduled_at', { ascending: false })
    .limit(10)

  // Load client invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Load workout sessions
  const { data: workoutSessions } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      workouts (
        id,
        name,
        description
      )
    `)
    .eq('client_id', params.id)
    .order('completed_at', { ascending: false })
    .limit(5)

  return (
    <ClientDetailPage
      client={client}
      appointments={appointments || []}
      invoices={invoices || []}
      trainerId={user.id}
      workoutSessions={workoutSessions || []}
    />
  )
}


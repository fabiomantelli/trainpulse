import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewAppointmentPage from '@/components/appointments/NewAppointmentPage'

export default async function NewAppointment() {
  const supabase = createServerClient()
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

  // #region agent log
  const logData = {location:'appointments/new/page.tsx:16',message:'Loading clients',data:{userId:user.id,clientsCount:clients?.length || 0,hasError:!!clientsError,errorMessage:clientsError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
  await fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
  // #endregion

  if (clientsError) {
    console.error('Error loading clients:', clientsError)
  }

  return <NewAppointmentPage trainerId={user.id} clients={clients || []} />
}


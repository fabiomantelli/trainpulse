import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EditClientPage from '@/components/clients/EditClientPage'

export default async function EditClient({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createServerClient()
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

  return <EditClientPage client={client} trainerId={user.id} />
}



import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewInvoicePage from '@/components/invoices/NewInvoicePage'

export default async function NewInvoice() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Load trainer profile
  const { data: trainerProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Load clients
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .eq('trainer_id', user.id)
    .order('name', { ascending: true })

  if (clientsError) {
    console.error('Error loading clients:', clientsError)
  }

  return <NewInvoicePage trainerId={user.id} clients={clients || []} trainerProfile={trainerProfile || undefined} />
}



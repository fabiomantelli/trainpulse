import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientsContent from '@/components/clients/ClientsContent'

export default async function ClientsPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return <ClientsContent trainerId={user.id} />
}


import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewClientForm from '@/components/clients/NewClientForm'

export default async function NewClientPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return <NewClientForm trainerId={user.id} />
}



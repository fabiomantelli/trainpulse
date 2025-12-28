import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InvoicesContent from '@/components/invoices/InvoicesContent'

export default async function InvoicesPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return <InvoicesContent trainerId={user.id} />
}



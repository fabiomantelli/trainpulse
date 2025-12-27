import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscriptionPageContent from '@/components/subscription/SubscriptionPageContent'

export default async function SubscriptionPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Load user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/dashboard')
  }

  return <SubscriptionPageContent profile={profile} />
}


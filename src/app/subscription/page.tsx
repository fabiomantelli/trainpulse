import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import SubscriptionPageContent from '@/components/subscription/SubscriptionPageContent'

export default async function SubscriptionPage() {
  const supabase = await createServerClient()
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

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscriptionPageContent profile={profile} />
    </Suspense>
  )
}




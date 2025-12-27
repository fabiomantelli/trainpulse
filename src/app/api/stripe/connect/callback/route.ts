import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isAccountReady } from '@/lib/stripe/server'

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(
        new URL('/auth?error=unauthorized', request.url)
      )
    }

    // Get user profile with Stripe account ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.redirect(
        new URL('/dashboard?error=stripe_account_not_found', request.url)
      )
    }

    const stripeAccountId = (profile as { stripe_account_id: string | null })?.stripe_account_id

    if (!stripeAccountId) {
      return NextResponse.redirect(
        new URL('/dashboard?error=stripe_account_not_found', request.url)
      )
    }

    // Check if account is ready
    const accountReady = await isAccountReady(stripeAccountId)

    if (accountReady) {
      return NextResponse.redirect(
        new URL('/dashboard?stripe_connected=true', request.url)
      )
    } else {
      return NextResponse.redirect(
        new URL('/dashboard?stripe_pending=true', request.url)
      )
    }
  } catch (error: any) {
    console.error('Error in Stripe Connect callback:', error)
    return NextResponse.redirect(
      new URL('/dashboard?error=stripe_callback_error', request.url)
    )
  }
}


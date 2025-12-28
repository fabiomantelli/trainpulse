import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'

/**
 * Sync subscription status from Stripe to database
 * This endpoint can be called periodically or when user requests refresh
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const typedProfile = profile as {
      stripe_subscription_id: string | null
      stripe_customer_id: string | null
    }

    if (!typedProfile.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Fetch latest subscription data from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      typedProfile.stripe_subscription_id
    )

    const sub = subscription as any

    // Determine subscription status
    const isScheduledForCancellation = sub.cancel_at_period_end === true
    let subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'cancelled'
    if (isScheduledForCancellation) {
      subscriptionStatus = 'cancelled'
    } else if (subscription.status === 'active') {
      subscriptionStatus = 'active'
    } else if (subscription.status === 'trialing') {
      subscriptionStatus = 'trialing'
    } else if (subscription.status === 'past_due') {
      subscriptionStatus = 'past_due'
    } else {
      subscriptionStatus = 'cancelled'
    }

    // Update profile with latest data
    const updateData: any = {
      subscription_status: subscriptionStatus,
      updated_at: new Date().toISOString(),
    }

    if (sub.current_period_end) {
      updateData.subscription_current_period_end = new Date(
        sub.current_period_end * 1000
      ).toISOString()
    }

    if (sub.cancel_at) {
      updateData.subscription_cancel_at = new Date(
        sub.cancel_at * 1000
      ).toISOString()
    } else if (sub.cancel_at_period_end && sub.current_period_end) {
      updateData.subscription_cancel_at = new Date(
        sub.current_period_end * 1000
      ).toISOString()
    } else {
      updateData.subscription_cancel_at = null
    }

    const { error: updateError } = await (supabase
      .from('profiles') as any)
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      console.error('Error syncing subscription:', updateError)
      return NextResponse.json(
        { error: 'Failed to sync subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subscription_status: subscriptionStatus,
      current_period_end: updateData.subscription_current_period_end,
      cancel_at: updateData.subscription_cancel_at,
    })
  } catch (error: any) {
    console.error('Error syncing subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


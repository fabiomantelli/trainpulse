import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Allow GET requests for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Webhook endpoint is active',
    webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set in environment variables')
    return NextResponse.json(
      { error: 'Webhook secret is not configured' },
      { status: 500 }
    )
  }

  // Get the raw body for signature verification
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Use service role client to bypass RLS for webhook operations
  const supabase = createServiceRoleClient()

  // Check if event was already processed (idempotency)
  const { data: existingEvent } = await (supabase
    .from('webhook_events') as any)
    .select('id')
    .eq('id', event.id)
    .maybeSingle()

  if (existingEvent) {
    return NextResponse.json({ received: true, skipped: true })
  }

  // Mark event as being processed
  const { error: insertError } = await (supabase
    .from('webhook_events') as any)
    .insert({
      id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
    })

  if (insertError) {
    // If insert fails (race condition), event might be processing elsewhere
    // Check again if event exists (might have been inserted by another request)
    const { data: recheckEvent } = await (supabase
      .from('webhook_events') as any)
      .select('id')
      .eq('id', event.id)
      .maybeSingle()

    if (recheckEvent) {
      return NextResponse.json({ received: true, skipped: true })
    }
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Only process subscription checkouts
        if (session.mode !== 'subscription') {
          return NextResponse.json({ received: true })
        }

        const trainerId = session.metadata?.trainer_id
        const subscriptionId = session.subscription as string
        const isEarlyAdopter = session.metadata?.is_early_adopter === 'true'

        if (!trainerId || !subscriptionId) {
          console.error('Missing trainer_id or subscription_id in checkout session')
          return NextResponse.json({ received: true })
        }

        // Verify trainerId exists in profiles table
        const { data: profileCheck } = await (supabase
          .from('profiles') as any)
          .select('id, subscription_status, stripe_subscription_id')
          .eq('id', trainerId)
          .maybeSingle()

        if (!profileCheck) {
          // Try to find any profile with this subscription_id
          const { data: profileBySub } = await (supabase
            .from('profiles') as any)
            .select('id, subscription_status, stripe_subscription_id')
            .eq('stripe_subscription_id', subscriptionId)
            .maybeSingle()

          // If still not found, create the profile
          if (!profileBySub) {
            // Get customer info from Stripe to get email
            let customerEmail = 'user@example.com'
            try {
              const customer = await stripe.customers.retrieve(session.customer as string)
              if (customer && !customer.deleted && customer.email) {
                customerEmail = customer.email
              }
            } catch (err) {
              // Use default email
            }

            // Create profile with minimal data
            const { error: createError } = await (supabase
              .from('profiles') as any)
              .insert({
                id: trainerId,
                full_name: customerEmail.split('@')[0] || 'User',
                timezone: 'UTC',
                subscription_status: 'trialing',
                trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                stripe_customer_id: session.customer as string,
              })
              .select()
              .single()

            if (createError) {
              console.error('Failed to create profile:', createError.message)
              return NextResponse.json({ received: true })
            }
          }
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const subCheckout = subscription as any

        // Check if subscription is scheduled for cancellation
        const isScheduledForCancellation = subCheckout.cancel_at_period_end === true
        
        // Determine subscription status
        // If cancel_at_period_end is true, mark as cancelled immediately (even though it's still active until period end)
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

        // Update profile with subscription information
        const updateData: any = {
          stripe_subscription_id: subscriptionId,
          subscription_status: subscriptionStatus,
          updated_at: new Date().toISOString(),
        }

        // Update is_early_adopter if provided in metadata
        if (isEarlyAdopter) {
          updateData.is_early_adopter = true
        }

        // Set trial_ends_at if subscription is in trial
        if (subscription.status === 'trialing' && subscription.trial_end) {
          updateData.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString()
        } else if (subscriptionStatus === 'active') {
          // Clear trial_ends_at when subscription becomes active (trial is over)
          updateData.trial_ends_at = null
        }

        // Store subscription period dates
        if (subCheckout.current_period_end) {
          updateData.subscription_current_period_end = new Date(subCheckout.current_period_end * 1000).toISOString()
        }
        if (subCheckout.cancel_at) {
          updateData.subscription_cancel_at = new Date(subCheckout.cancel_at * 1000).toISOString()
        } else if (subCheckout.cancel_at_period_end && subCheckout.current_period_end) {
          // If cancel_at_period_end is true, use current_period_end as cancel_at
          updateData.subscription_cancel_at = new Date(subCheckout.current_period_end * 1000).toISOString()
        } else {
          // Clear cancel_at if subscription is not scheduled for cancellation
          updateData.subscription_cancel_at = null
        }

        const { error: updateError } = await (supabase
          .from('profiles') as any)
          .update(updateData)
          .eq('id', trainerId)

        if (updateError) {
          console.error('Error updating profile after checkout:', updateError.message)
          return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
          )
        }
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const trainerId = subscription.metadata?.trainer_id

        if (!trainerId) {
          console.error('Missing trainer_id in subscription metadata:', subscription.id)
          return NextResponse.json({ received: true })
        }

        // Check if subscription is scheduled for cancellation
        const sub = subscription as any
        const isScheduledForCancellation = sub.cancel_at_period_end === true
        
        // Determine subscription status
        // If cancel_at_period_end is true, mark as cancelled immediately (even though it's still active until period end)
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

        const updateData: any = {
          stripe_subscription_id: subscription.id,
          subscription_status: subscriptionStatus,
          updated_at: new Date().toISOString(),
        }

        if (subscription.metadata?.is_early_adopter === 'true') {
          updateData.is_early_adopter = true
        }

        if (subscription.status === 'trialing' && subscription.trial_end) {
          updateData.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString()
        } else if (subscriptionStatus === 'active') {
          // Clear trial_ends_at when subscription becomes active (trial is over)
          updateData.trial_ends_at = null
        }

        // Store subscription period dates
        const subCreated = subscription as any
        if (subCreated.current_period_end) {
          updateData.subscription_current_period_end = new Date(subCreated.current_period_end * 1000).toISOString()
        }
        if (subCreated.cancel_at) {
          updateData.subscription_cancel_at = new Date(subCreated.cancel_at * 1000).toISOString()
        } else if (subCreated.cancel_at_period_end && subCreated.current_period_end) {
          updateData.subscription_cancel_at = new Date(subCreated.current_period_end * 1000).toISOString()
        } else {
          updateData.subscription_cancel_at = null
        }

        const { error: updateError } = await (supabase
          .from('profiles') as any)
          .update(updateData)
          .eq('id', trainerId)

        if (updateError) {
          console.error('Error updating profile after subscription creation:', updateError.message)
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const trainerId = subscription.metadata?.trainer_id

        if (!trainerId) {
          // Try to find by subscription_id
          const { data: profile, error: profileError } = await (supabase
            .from('profiles') as any)
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .single()

          if (profileError || !profile) {
            console.error('Could not find profile for subscription:', subscription.id)
            return NextResponse.json({ received: true })
          }

          const sub = subscription as any
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

          const updateData: any = {
            subscription_status: subscriptionStatus,
            updated_at: new Date().toISOString(),
          }

          if (subscription.status === 'trialing' && subscription.trial_end) {
            updateData.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString()
          }

          if (sub.current_period_end) {
            updateData.subscription_current_period_end = new Date(sub.current_period_end * 1000).toISOString()
          }
          if (sub.cancel_at) {
            updateData.subscription_cancel_at = new Date(sub.cancel_at * 1000).toISOString()
          } else if (sub.cancel_at_period_end && sub.current_period_end) {
            updateData.subscription_cancel_at = new Date(sub.current_period_end * 1000).toISOString()
          } else {
            updateData.subscription_cancel_at = null
          }

          const { error: updateError } = await (supabase
            .from('profiles') as any)
            .update(updateData)
            .eq('id', profile.id)

          if (updateError) {
            console.error('Error updating profile after subscription update:', updateError.message)
          }

          return NextResponse.json({ received: true })
        }

        // Check if subscription is scheduled for cancellation
        const sub = subscription as any
        const isScheduledForCancellation = sub.cancel_at_period_end === true
        
        // Determine subscription status
        // If cancel_at_period_end is true, mark as cancelled immediately (even though it's still active until period end)
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

        const updateData: any = {
          subscription_status: subscriptionStatus,
          updated_at: new Date().toISOString(),
        }

        // Clear trial_ends_at when subscription becomes active (trial is over)
        if (subscriptionStatus === 'active') {
          updateData.trial_ends_at = null
        }

        // Store subscription period dates
        const subUpdated = subscription as any
        if (subUpdated.current_period_end) {
          updateData.subscription_current_period_end = new Date(subUpdated.current_period_end * 1000).toISOString()
        }
        if (subUpdated.cancel_at) {
          updateData.subscription_cancel_at = new Date(subUpdated.cancel_at * 1000).toISOString()
        } else if (subUpdated.cancel_at_period_end && subUpdated.current_period_end) {
          // If cancel_at_period_end is true, use current_period_end as cancel_at
          updateData.subscription_cancel_at = new Date(subUpdated.current_period_end * 1000).toISOString()
        } else {
          // Clear cancel_at if subscription is not scheduled for cancellation
          updateData.subscription_cancel_at = null
        }

        const { data: beforeUpdate } = await (supabase
          .from('profiles') as any)
          .select('id')
          .eq('id', trainerId)
          .maybeSingle()

        if (!beforeUpdate) {
          // Try to find by subscription_id instead
          const { data: profileBySub } = await (supabase
            .from('profiles') as any)
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .maybeSingle()
          
          if (profileBySub) {
            const { error: updateError } = await (supabase
              .from('profiles') as any)
              .update(updateData)
              .eq('id', profileBySub.id)

            if (updateError) {
              console.error('Error updating profile:', updateError.message)
            }
            break
          }
        }

        if (subscription.status === 'trialing' && subscription.trial_end) {
          updateData.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString()
        }

        const { error: updateError } = await (supabase
          .from('profiles') as any)
          .update(updateData)
          .eq('id', trainerId)

        if (updateError) {
          console.error('Error updating profile after subscription update:', updateError.message)
        } else {
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const trainerId = subscription.metadata?.trainer_id

        if (!trainerId) {
          // Try to find by subscription_id
          const { data: profile } = await (supabase
            .from('profiles') as any)
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .single()

          if (!profile) {
            console.error('Could not find profile for deleted subscription:', subscription.id)
            return NextResponse.json({ received: true })
          }

          const { error: updateError } = await (supabase
            .from('profiles') as any)
            .update({
              subscription_status: 'cancelled',
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id)

          if (updateError) {
            console.error('Error updating profile after subscription deletion:', updateError)
          }

          return NextResponse.json({ received: true })
        }

        const { error: updateError } = await (supabase
          .from('profiles') as any)
          .update({
            subscription_status: 'cancelled',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', trainerId)

        if (updateError) {
          console.error('Error updating profile after subscription deletion:', updateError)
        }

        break
      }

      default:
        // Unhandled event type - log for monitoring
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error.message)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createServerClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  const supabase = await createServerClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const trainerId = session.metadata?.trainer_id
        const isEarlyAdopterFromMetadata = session.metadata?.is_early_adopter === 'true'

        if (!trainerId || !session.subscription) {
          console.error('Missing trainer_id or subscription in checkout session')
          break
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        // Check if subscription uses early adopter price ($19 = 1900 cents)
        const priceId = subscription.items.data[0]?.price.id
        let isEarlyAdopter = isEarlyAdopterFromMetadata

        if (priceId) {
          const price = await stripe.prices.retrieve(priceId)
          // Verify price is $19 (early adopter) or $29 (standard)
          if (price.unit_amount === 1900) {
            isEarlyAdopter = true
          } else if (price.unit_amount === 2900) {
            isEarlyAdopter = false
          }
        }

        // Update profile with subscription info
        await (supabase
          .from('profiles') as any)
          .update({
            stripe_subscription_id: subscription.id,
            stripe_customer_id: session.customer as string,
            subscription_status: subscription.status === 'active' ? 'active' : 'trialing',
            is_early_adopter: isEarlyAdopter,
          })
          .eq('id', trainerId)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const trainerId = subscription.metadata?.trainer_id

        // Check if subscription uses early adopter price
        const priceId = subscription.items.data[0]?.price.id
        let isEarlyAdopter: boolean | undefined = undefined

        if (priceId) {
          try {
            const price = await stripe.prices.retrieve(priceId)
            if (price.unit_amount === 1900) {
              isEarlyAdopter = true
            } else if (price.unit_amount === 2900) {
              isEarlyAdopter = false
            }
          } catch (error) {
            console.error('Error retrieving price:', error)
          }
        }

        if (!trainerId) {
          // Try to find by subscription_id
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, is_early_adopter')
            .eq('stripe_subscription_id', subscription.id)
            .single()

          if (!profile) {
            console.error('Could not find profile for subscription update')
            break
          }

          const typedProfile = profile as { id: string; is_early_adopter: boolean | null }

          // Update subscription status
          let status: 'active' | 'cancelled' | 'past_due' | 'trialing' = 'trialing'
          if (subscription.status === 'active') {
            status = 'active'
          } else if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
            status = 'cancelled'
          } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
            status = 'past_due'
          }

          // Preserve early adopter status if already set, or update if we detected it
          const updateData: any = { subscription_status: status }
          if (isEarlyAdopter !== undefined) {
            updateData.is_early_adopter = isEarlyAdopter
          } else if (typedProfile.is_early_adopter) {
            // Preserve existing early adopter status
            updateData.is_early_adopter = true
          }

          await (supabase
            .from('profiles') as any)
            .update(updateData)
            .eq('id', typedProfile.id)
        } else {
          let status: 'active' | 'cancelled' | 'past_due' | 'trialing' = 'trialing'
          if (subscription.status === 'active') {
            status = 'active'
          } else if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
            status = 'cancelled'
          } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
            status = 'past_due'
          }

          const updateData: any = {
            stripe_subscription_id: subscription.id,
            subscription_status: status,
          }
          if (isEarlyAdopter !== undefined) {
            updateData.is_early_adopter = isEarlyAdopter
          }

          await (supabase
            .from('profiles') as any)
            .update(updateData)
            .eq('id', trainerId)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const trainerId = subscription.metadata?.trainer_id

        if (trainerId) {
          await (supabase
            .from('profiles') as any)
            .update({
              subscription_status: 'cancelled',
              stripe_subscription_id: null,
            })
            .eq('id', trainerId)
        } else {
          // Find by subscription_id
          await (supabase
            .from('profiles') as any)
            .update({
              subscription_status: 'cancelled',
              stripe_subscription_id: null,
            })
            .eq('stripe_subscription_id', subscription.id)
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        // Invoice.subscription can be string (ID) or Stripe.Subscription object or null
        const subscription = (invoice as any).subscription
        const subscriptionId = typeof subscription === 'string' 
          ? subscription 
          : subscription?.id || null

        if (subscriptionId) {
          // Update subscription status to active
          await (supabase
            .from('profiles') as any)
            .update({ subscription_status: 'active' })
            .eq('stripe_subscription_id', subscriptionId)
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        // Invoice.subscription can be string (ID) or Stripe.Subscription object or null
        const subscription = (invoice as any).subscription
        const subscriptionId = typeof subscription === 'string' 
          ? subscription 
          : subscription?.id || null

        if (subscriptionId) {
          // Update subscription status to past_due
          await (supabase
            .from('profiles') as any)
            .update({ subscription_status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId)

          // Create notification for payment failure
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (profile) {
            await (supabase.from('notifications') as any).insert({
              trainer_id: (profile as { id: string }).id,
              type: 'system_update',
              title: 'Payment Failed',
              message: 'Your subscription payment failed. Please update your payment method.',
              related_type: 'subscription',
            })
          }
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}


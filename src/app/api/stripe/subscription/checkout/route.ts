import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  getOrCreateCustomer,
  createCheckoutSession,
} from '@/lib/stripe/subscriptions'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

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
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const typedProfile = profile as Profile

    // Get or create Stripe customer
    let customerId = typedProfile.stripe_customer_id

    customerId = await getOrCreateCustomer(
      user.id,
      user.email || '',
      typedProfile.full_name || undefined,
      typedProfile.stripe_customer_id
    )

    // Save customer ID to profile if it changed
    if (customerId !== typedProfile.stripe_customer_id) {
      await (supabase
        .from('profiles') as any)
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Check if user is already an early adopter or can become one
    let isEarlyAdopter = typedProfile.is_early_adopter || false

    // If not already an early adopter, try to mark them as one (atomic operation)
    if (!isEarlyAdopter) {
      const { data: canBeEarlyAdopter, error: earlyAdopterError } = await (supabase as any)
        .rpc('try_mark_early_adopter', { p_user_id: user.id })

      if (earlyAdopterError) {
        console.error('Error checking early adopter status:', earlyAdopterError)
        // Continue with standard pricing if there's an error
        isEarlyAdopter = false
      } else {
        isEarlyAdopter = canBeEarlyAdopter === true
      }

      // If successfully marked as early adopter, update profile
      if (isEarlyAdopter) {
        await (supabase
          .from('profiles') as any)
          .update({ is_early_adopter: true })
          .eq('id', user.id)
      }
    }

    // Create checkout session with appropriate pricing
    const returnUrl = `${request.nextUrl.origin}/subscription?success=true`
    const checkoutUrl = await createCheckoutSession(
      customerId,
      user.id,
      returnUrl,
      isEarlyAdopter
    )

    return NextResponse.json({ url: checkoutUrl })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


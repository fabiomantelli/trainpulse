import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { sendInvoice } from '@/lib/stripe/invoices'
import { Database } from '@/types/database.types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { invoiceId, trainerId } = body

    if (user.id !== trainerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get trainer profile
    const { data: trainer, error: trainerError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', trainerId)
      .single()

    if (trainerError || !trainer) {
      return NextResponse.json(
        { error: 'Stripe account not found' },
        { status: 404 }
      )
    }

    const stripeAccountId = (trainer as { stripe_account_id: string | null })?.stripe_account_id

    if (!stripeAccountId) {
      return NextResponse.json(
        { error: 'Stripe account not connected' },
        { status: 400 }
      )
    }

    // Send invoice via Stripe
    await sendInvoice(invoiceId, stripeAccountId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error sending Stripe invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


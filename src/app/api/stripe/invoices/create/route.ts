import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createStripeInvoice } from '@/lib/stripe/invoices'
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
    const { trainerId, clientId, amount, description, dueDate } = body

    if (user.id !== trainerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get trainer profile
    const { data: trainer, error: trainerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', trainerId)
      .single()

    if (trainerError || !trainer) {
      return NextResponse.json(
        { error: 'Trainer profile not found' },
        { status: 404 }
      )
    }

    const typedTrainer = trainer as Database['public']['Tables']['profiles']['Row']

    if (!typedTrainer.stripe_account_id) {
      return NextResponse.json(
        { error: 'Stripe account not connected' },
        { status: 400 }
      )
    }

    // Get client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('trainer_id', trainerId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Create invoice in Stripe
    const stripeInvoice = await createStripeInvoice({
      trainer: typedTrainer,
      client: client as Database['public']['Tables']['clients']['Row'],
      amount,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    })

    return NextResponse.json({
      stripeInvoiceId: stripeInvoice.id,
      invoiceUrl: stripeInvoice.hosted_invoice_url,
    })
  } catch (error: any) {
    console.error('Error creating Stripe invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


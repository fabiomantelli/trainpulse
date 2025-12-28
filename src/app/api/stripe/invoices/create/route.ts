import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // MVP: Stripe Connect invoice creation is disabled
  // Invoices are now managed locally only
  return NextResponse.json(
    { 
      error: 'Stripe Connect is not available in the MVP. Please create invoices locally through the app interface.' 
    },
    { status: 503 }
  )
}


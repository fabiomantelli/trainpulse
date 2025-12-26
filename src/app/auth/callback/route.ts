import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'
    const origin = requestUrl.origin

    if (!code) {
      // No code provided
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent('No authentication code provided')}`, origin)
      )
    }

    const supabase = createServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, origin)
      )
    }

    if (!data.session) {
      console.error('No session returned from exchangeCodeForSession')
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent('Session could not be established')}`, origin)
      )
    }

    // Successful exchange - redirect to dashboard
    return NextResponse.redirect(new URL(next, origin))
  } catch (error) {
    console.error('Unexpected error in callback:', error)
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent('An unexpected error occurred')}`, requestUrl.origin)
    )
  }
}


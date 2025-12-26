import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'

    if (code) {
      const supabase = createServerClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        const origin = requestUrl.origin
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, request.url)
        )
      }
    }

    // No code provided
    return NextResponse.redirect(
      new URL('/auth/signin?error=No authentication code provided', request.url)
    )
  } catch (error) {
    console.error('Unexpected error in callback:', error)
    return NextResponse.redirect(
      new URL('/auth/signin?error=An unexpected error occurred', request.url)
    )
  }
}


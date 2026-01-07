import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Database } from '@/types/database.types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const token = requestUrl.searchParams.get('token')
    const type = requestUrl.searchParams.get('type')
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'
    const origin = requestUrl.origin

    // Create Supabase client with proper cookie handling
    const cookieStore = await cookies()
    const response = NextResponse.redirect(new URL(next, origin))
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set(name, value, options)
              response.cookies.set(name, value, options)
            } catch {
              // Ignore if called from Server Component
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set(name, '', { ...options, maxAge: 0 })
              response.cookies.set(name, '', { ...options, maxAge: 0 })
            } catch {
              // Ignore if called from Server Component
            }
          },
        },
      }
    )

    // Handle PKCE flow with code parameter (modern Supabase)
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(
          new URL(`/auth?error=${encodeURIComponent(error.message)}`, origin)
        )
      }

      if (!data.session) {
        console.error('No session returned from exchangeCodeForSession')
        return NextResponse.redirect(
          new URL(`/auth?error=${encodeURIComponent('Session could not be established')}`, origin)
        )
      }

      return response
    }

    // Handle token-based flow (older email confirmation)
    if (token && type) {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as any,
      })
      
      if (verifyError) {
        return NextResponse.redirect(
          new URL(`/auth?error=${encodeURIComponent(verifyError.message)}`, origin)
        )
      }

      if (verifyData?.session) {
        return response
      }
    }

    // No code or token - check if user already has a session (email might already be confirmed)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      return response
    }

    // No code, no token, no session - redirect to signin with error
    const redirectUrl = new URL(`/auth?error=${encodeURIComponent('No authentication code provided. Please click the confirmation link from your email.')}`, origin)
    
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Unexpected error in callback:', error)
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent('An unexpected error occurred')}`, requestUrl.origin)
    )
  }
}


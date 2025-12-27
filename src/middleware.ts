import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export async function middleware(request: NextRequest) {
  // #region agent log
  const pathname = request.nextUrl.pathname
  if (pathname.includes('auth')) {
    const allParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:6',message:'Middleware processing auth route',data:{pathname,fullUrl:request.url,allParams,hasCode:!!request.nextUrl.searchParams.get('code'),hasToken:!!request.nextUrl.searchParams.get('token')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  }
  // #endregion

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client for middleware
  const supabase = createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  await supabase.auth.getUser()
  
  // Add pathname to headers so the layout can access it during SSR
  response.headers.set('x-pathname', pathname)
  
  // Check subscription status for protected routes (except auth, subscription, and API routes)
  const protectedPaths = ['/dashboard', '/clients', '/appointments', '/workouts', '/invoices', '/settings']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isAuthPath = pathname.startsWith('/auth') || pathname.startsWith('/api/stripe/subscription') || pathname.startsWith('/subscription')
  const isWebhookPath = pathname.startsWith('/api/stripe/webhooks')
  
  if (isProtectedPath && !isAuthPath && !isWebhookPath) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status, trial_ends_at')
          .eq('id', user.id)
          .single()
        
        // Type assertion for the selected columns
        const typedProfile = profile as Pick<Profile, 'subscription_status' | 'trial_ends_at'> | null
        
        if (typedProfile) {
          const now = new Date()
          const trialEndsAt = typedProfile.trial_ends_at ? new Date(typedProfile.trial_ends_at) : null
          const isTrialExpired = trialEndsAt && trialEndsAt < now
          const isActive = typedProfile.subscription_status === 'active'
          const isTrialing = typedProfile.subscription_status === 'trialing'
          
          // If trial expired and not active, redirect to subscription page
          if (isTrialExpired && !isActive && isTrialing) {
            return NextResponse.redirect(new URL('/subscription?trial_expired=true', request.url))
          }
        }
      }
    } catch (error) {
      // If there's an error checking subscription, allow access (fail open)
      // This prevents blocking users if there's a database issue
      console.error('Error checking subscription in middleware:', error)
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (Supabase callback route)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}


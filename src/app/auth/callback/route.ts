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
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'
    const origin = requestUrl.origin

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:11',message:'Callback route called',data:{requestUrl:request.url,origin,host:requestUrl.host,protocol:requestUrl.protocol,code:!!code,next,envAppUrl:process.env.NEXT_PUBLIC_APP_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!code) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:16',message:'No code provided',data:{origin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // No code provided
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent('No authentication code provided')}`, origin)
      )
    }

    // Create Supabase client with proper cookie handling for PKCE
    const cookieStore = cookies()
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
    
    // #region agent log
    const cookieHeader = request.headers.get('cookie') || ''
    const hasPkceCookie = cookieHeader.includes('sb-') && (cookieHeader.includes('code-verifier') || cookieHeader.includes('pkce'))
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:35',message:'Before exchangeCodeForSession',data:{code:!!code,origin,hasCookies:!!cookieHeader,hasPkceCookie,cookieCount:cookieHeader.split(';').length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:30',message:'Exchange code response',data:{hasError:!!error,errorMessage:error?.message,hasSession:!!data?.session,origin,redirectTo:`${origin}${next}`,errorCode:error?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (error) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:30',message:'Exchange code error',data:{errorMessage:error.message,origin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, origin)
      )
    }

    if (!data.session) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:37',message:'No session returned',data:{origin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('No session returned from exchangeCodeForSession')
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent('Session could not be established')}`, origin)
      )
    }

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:65',message:'Successful exchange, redirecting',data:{origin,next,redirectUrl:`${origin}${next}`,hasSession:!!data?.session},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Successful exchange - redirect to dashboard with cookies
    return response
  } catch (error) {
    console.error('Unexpected error in callback:', error)
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent('An unexpected error occurred')}`, requestUrl.origin)
    )
  }
}


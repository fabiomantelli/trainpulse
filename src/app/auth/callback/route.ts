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

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:8',message:'Callback route called',data:{requestUrl:request.url,origin,host:requestUrl.host,protocol:requestUrl.protocol,code:!!code,next,envAppUrl:process.env.NEXT_PUBLIC_APP_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
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

    const supabase = createServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:25',message:'Exchange code response',data:{hasError:!!error,errorMessage:error?.message,hasSession:!!data?.session,origin,redirectTo:`${origin}${next}`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
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
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:45',message:'Successful exchange, redirecting',data:{origin,next,redirectUrl:`${origin}${next}`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

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


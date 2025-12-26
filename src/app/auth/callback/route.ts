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

    // #region agent log
    const allParams = Object.fromEntries(requestUrl.searchParams.entries())
    const headers = Object.fromEntries(request.headers.entries())
    const referer = request.headers.get('referer') || 'no-referer'
    const userAgent = request.headers.get('user-agent') || 'no-user-agent'
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:11',message:'Callback route called - DETAILED',data:{requestUrl:request.url,fullUrl:requestUrl.href,pathname:requestUrl.pathname,search:requestUrl.search,hash:requestUrl.hash,origin,host:requestUrl.host,hostname:requestUrl.hostname,protocol:requestUrl.protocol,port:requestUrl.port,code:!!code,codeValue:code?.substring(0,20)+'...',token:!!token,tokenValue:token?.substring(0,20)+'...',type,next,envAppUrl:process.env.NEXT_PUBLIC_APP_URL,allParams,paramCount:Object.keys(allParams).length,referer,userAgentShort:userAgent.substring(0,50),hasCookies:!!request.headers.get('cookie'),cookieCount:request.headers.get('cookie')?.split(';').length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Create Supabase client with proper cookie handling
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

    // Handle PKCE flow with code parameter (modern Supabase)
    if (code) {
      // #region agent log
      const cookieHeader = request.headers.get('cookie') || ''
      const hasPkceCookie = cookieHeader.includes('sb-') && (cookieHeader.includes('code-verifier') || cookieHeader.includes('pkce'))
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:45',message:'PKCE flow detected, exchanging code',data:{code:!!code,origin,hasCookies:!!cookieHeader,hasPkceCookie,cookieCount:cookieHeader.split(';').length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:50',message:'Exchange code response',data:{hasError:!!error,errorMessage:error?.message,hasSession:!!data?.session,origin,redirectTo:`${origin}${next}`,errorCode:error?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      if (error) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:55',message:'Exchange code error',data:{errorMessage:error.message,origin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, origin)
        )
      }

      if (!data.session) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:62',message:'No session returned',data:{origin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error('No session returned from exchangeCodeForSession')
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent('Session could not be established')}`, origin)
        )
      }

      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:70',message:'Successful PKCE exchange, redirecting',data:{origin,next,redirectUrl:`${origin}${next}`,hasSession:!!data?.session},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      return response
    }

    // Handle token-based flow (older email confirmation)
    if (token && type) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:75',message:'Token-based flow detected',data:{type,token:!!token,origin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as any,
      })
      
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:80',message:'Token verification response',data:{hasError:!!verifyError,errorMessage:verifyError?.message,hasSession:!!verifyData?.session,origin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      if (verifyError) {
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent(verifyError.message)}`, origin)
        )
      }

      if (verifyData?.session) {
        return response
      }
    }

    // No code or token - check if user already has a session (email might already be confirmed)
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:95',message:'No code or token, checking existing session',data:{origin,allParams},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:100',message:'Existing session found, redirecting',data:{origin,next,hasSession:!!session},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return response
    }

    // No code, no token, no session - redirect to signin with error
    // #region agent log
    const redirectUrl = new URL(`/auth/signin?error=${encodeURIComponent('No authentication code provided. Please click the confirmation link from your email.')}`, origin)
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/callback/route.ts:105',message:'No authentication method found - REDIRECTING TO SIGNIN',data:{origin,requestUrl:request.url,allParams,paramCount:Object.keys(allParams).length,redirectUrl:redirectUrl.href,hasCode:!!code,hasToken:!!token,hasType:!!type,pathname:requestUrl.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Unexpected error in callback:', error)
    const requestUrl = new URL(request.url)
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent('An unexpected error occurred')}`, requestUrl.origin)
    )
  }
}


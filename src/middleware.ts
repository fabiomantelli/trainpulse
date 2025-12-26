import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // #region agent log
  const pathname = request.nextUrl.pathname
  if (pathname.includes('auth')) {
    const allParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:6',message:'Middleware processing auth route',data:{pathname,fullUrl:request.url,allParams,hasCode:!!request.nextUrl.searchParams.get('code'),hasToken:!!request.nextUrl.searchParams.get('token')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  }
  // #endregion

  const response = await updateSession(request)
  
  // Add pathname to headers so the layout can access it during SSR
  response.headers.set('x-pathname', pathname)
  
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


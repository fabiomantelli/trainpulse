import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Get pathname before creating response
  const pathname = request.nextUrl.pathname
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  
  // Helper function to ensure pathname header is always set
  const ensurePathnameHeader = (resp: NextResponse) => {
    resp.headers.set('x-pathname', pathname)
    return resp
  }
  
  // Add pathname to headers so the layout can access it during SSR
  ensurePathnameHeader(response)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Ensure cookies have path set for persistence across routes
          const cookieOptions: CookieOptions = {
            ...options,
            path: options.path || '/',
          }
          
          request.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
          // Ensure pathname header is set even when response is recreated
          ensurePathnameHeader(response)
        },
        remove(name: string, options: CookieOptions) {
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
          // Ensure pathname header is set even when response is recreated
          ensurePathnameHeader(response)
        },
      },
    }
  )

  await supabase.auth.getUser()

  // Ensure pathname header is set before returning
  return ensurePathnameHeader(response)
}


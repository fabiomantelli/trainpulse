'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SignInContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // #region agent log
    const allParams = Object.fromEntries(new URLSearchParams(window.location.search).entries())
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/signin/page.tsx:17',message:'SignIn page loaded',data:{currentUrl:window.location.href,pathname:window.location.pathname,search:window.location.search,hash:window.location.hash,allParams,paramCount:Object.keys(allParams).length,referrer:document.referrer,hasError:!!searchParams.get('error'),errorValue:searchParams.get('error')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Check if user is already authenticated
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/signin/page.tsx:22',message:'Session check result',data:{hasSession:!!session,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      if (session) {
        router.push('/dashboard')
        router.refresh()
      }
    }
    checkUser()

    // Check for error in URL params
    const errorParam = searchParams.get('error')
    if (errorParam) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/signin/page.tsx:32',message:'Error param found in URL',data:{errorParam,decodedError:decodeURIComponent(errorParam)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams, supabase, router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        // Get the session to ensure it's established
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // Successfully signed in - refresh to sync with server then navigate
          router.refresh()
          router.push('/dashboard')
        } else {
          setError('Session could not be established. Please try again.')
          setLoading(false)
        }
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Sign in to TrainPulse
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              New to TrainPulse?{' '}
              <Link
                href="/auth"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Get started
              </Link>
              {' '}or{' '}
              <Link
                href="/auth/signup"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                create an account
              </Link>
            </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-slate-400 text-gray-900 dark:text-white bg-white dark:bg-slate-800 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-slate-400 text-gray-900 dark:text-white bg-white dark:bg-slate-800 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}

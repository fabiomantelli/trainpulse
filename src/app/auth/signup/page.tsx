'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVerification, setShowVerification] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
        router.refresh()
      }
    }
    checkUser()
  }, [supabase, router])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/signup/page.tsx:29',message:'handleSignUp called',data:{email,hasFullName:!!fullName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    try {
      // Get the current origin - prioritize NEXT_PUBLIC_APP_URL, then window.location, then fallback
      let currentOrigin = 'http://localhost:3000'
      if (typeof window !== 'undefined') {
        // In browser: use NEXT_PUBLIC_APP_URL if set, otherwise use window.location.origin
        currentOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      } else {
        // Server-side: use NEXT_PUBLIC_APP_URL
        currentOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }
      
      // Remove trailing slash if present
      currentOrigin = currentOrigin.replace(/\/$/, '')
      const emailRedirectTo = `${currentOrigin}/auth/callback`
      
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/signup/page.tsx:42',message:'SignUp with emailRedirectTo',data:{currentOrigin,emailRedirectTo,envAppUrl:process.env.NEXT_PUBLIC_APP_URL,windowOrigin:typeof window !== 'undefined' ? window.location.origin : 'N/A',isBrowser:typeof window !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      console.log('🔗 Email Redirect URL:', { currentOrigin, emailRedirectTo, envAppUrl: process.env.NEXT_PUBLIC_APP_URL })

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: fullName,
          },
        },
      })

      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/signup/page.tsx:43',message:'signUp response',data:{hasError:!!error,errorMessage:error?.message,hasData:!!data,hasUser:!!data?.user,hasSession:!!data?.session,userId:data?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Log detailed signup response for debugging email sending
      console.log('🔍 SignUp Response:', {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        userEmail: data?.user?.email,
        userConfirmed: data?.user?.email_confirmed_at ? 'Yes' : 'No',
        error: error?.message,
        fullResponse: data
      })

      if (error) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/signup/page.tsx:46',message:'signUp error',data:{errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setError(error.message)
        setLoading(false)
        return
      }

      // Check if session is in the signUp response
      if (data?.session) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/signup/page.tsx:53',message:'Session found in signUp response',data:{hasSession:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        await new Promise(resolve => setTimeout(resolve, 300))
        router.refresh()
        router.push('/dashboard')
        return
      }

      // If no session but user was created, email verification is required
      if (data?.user && !data?.session) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/signup/page.tsx:58',message:'Email verification required',data:{hasUser:true,hasSession:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // Log email verification status
        const emailConfirmed = !!data.user.email_confirmed_at
        console.log('📧 Email Verification Status:', {
          email: data.user.email,
          emailConfirmed,
          emailSent: !emailConfirmed, // Supabase sends email automatically if not confirmed
          userId: data.user.id
        })
        
        // Note: Supabase automatically sends verification email when user is created
        // and email_confirmations is enabled in the dashboard
        setEmailSent(!emailConfirmed) // Assume email was sent if not confirmed
        setShowVerification(true)
        setLoading(false)
        return
      }

      // If no session in signUp response, try to sign in (fallback for cases where email confirmation is disabled)
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/signup/page.tsx:64',message:'No session in signUp, calling signInWithPassword',data:{hasUser:!!data?.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/signup/page.tsx:70',message:'signInWithPassword response',data:{hasError:!!signInError,errorMessage:signInError?.message,hasSession:!!signInData?.session,hasUser:!!signInData?.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (signInError) {
        // Check if error is due to email not confirmed
        if (signInError.message.toLowerCase().includes('email not confirmed') || 
            signInError.message.toLowerCase().includes('confirm your email')) {
          setEmailSent(true)
          setShowVerification(true)
          setLoading(false)
          return
        }
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/signup/page.tsx:80',message:'signInWithPassword error',data:{errorMessage:signInError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setError(signInError.message || 'Account created but could not sign in. Please try signing in manually.')
        setLoading(false)
        return
      }

      if (signInData?.session) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/signup/page.tsx:88',message:'Session established via signIn, redirecting',data:{hasSession:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Wait a moment for the profile trigger to complete
        await new Promise(resolve => setTimeout(resolve, 300))
        router.refresh()
        router.push('/dashboard')
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/signup/page.tsx:94',message:'No session after signInWithPassword',data:{hasSignInData:!!signInData},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setError('Account created but session could not be established. Please try signing in.')
        setLoading(false)
      }
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/signup/page.tsx:85',message:'handleSignUp exception',data:{errorMessage:err instanceof Error ? err.message : String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('Sign up error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setResendingEmail(true)
    setError(null)
    try {
      // Get the current origin - prioritize NEXT_PUBLIC_APP_URL, then window.location, then fallback
      let currentOrigin = 'http://localhost:3000'
      if (typeof window !== 'undefined') {
        // In browser: use NEXT_PUBLIC_APP_URL if set, otherwise use window.location.origin
        currentOrigin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      } else {
        // Server-side: use NEXT_PUBLIC_APP_URL
        currentOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }
      
      // Remove trailing slash if present
      currentOrigin = currentOrigin.replace(/\/$/, '')
      const emailRedirectTo = `${currentOrigin}/auth/callback`
      
      console.log('📧 Resending verification email to:', email)
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/signup/page.tsx:155',message:'Resend email with redirectTo',data:{email,emailRedirectTo,currentOrigin,envAppUrl:process.env.NEXT_PUBLIC_APP_URL,windowOrigin:typeof window !== 'undefined' ? window.location.origin : 'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      console.log('🔗 Email Redirect URL (resend):', { currentOrigin, emailRedirectTo, envAppUrl: process.env.NEXT_PUBLIC_APP_URL })
      
      const { data, error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo,
        },
      })
      
      console.log('📧 Resend response:', { data, error: resendError?.message })
      
      if (resendError) {
        console.error('❌ Failed to resend email:', resendError)
        setError(resendError.message || 'Failed to resend email. Please check your Supabase configuration.')
      } else {
        console.log('✅ Email resend successful')
        setEmailSent(true)
        setError(null)
      }
    } catch (err) {
      console.error('❌ Exception while resending email:', err)
      setError('Failed to resend email. Please try again or check your Supabase configuration.')
    } finally {
      setResendingEmail(false)
    }
  }

  const getPasswordStrength = (pwd: string): { strength: 'weak' | 'medium' | 'strong', score: number } => {
    if (pwd.length === 0) return { strength: 'weak', score: 0 }
    let score = 0
    if (pwd.length >= 6) score++
    if (pwd.length >= 8) score++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
    if (/\d/.test(pwd)) score++
    if (/[^a-zA-Z\d]/.test(pwd)) score++
    
    if (score <= 2) return { strength: 'weak', score }
    if (score <= 3) return { strength: 'medium', score }
    return { strength: 'strong', score }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <AnimatePresence mode="wait">
          {!showVerification ? (
            <motion.div
              key="signup-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                  Create your TrainPulse account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link
                    href="/auth"
                    className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
              <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800"
                  >
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </motion.div>
                )}
                <div className="rounded-md shadow-sm space-y-4">
                  <div>
                    <label htmlFor="fullName" className="sr-only">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-slate-400 text-gray-900 dark:text-white bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all hover:border-gray-400 dark:hover:border-slate-500"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
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
                      className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-slate-400 text-gray-900 dark:text-white bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all hover:border-gray-400 dark:hover:border-slate-500"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
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
                      autoComplete="new-password"
                      required
                      minLength={6}
                      className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-slate-400 text-gray-900 dark:text-white bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all hover:border-gray-400 dark:hover:border-slate-500"
                      placeholder="Password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    {password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 space-y-2"
                      >
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => {
                            const pwdStrength = getPasswordStrength(password)
                            const isActive = level <= (pwdStrength.score || 0)
                            const colorClass = pwdStrength.strength === 'weak' 
                              ? 'bg-red-500' 
                              : pwdStrength.strength === 'medium' 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                            return (
                              <div
                                key={level}
                                className={`h-1 flex-1 rounded-full transition-all ${
                                  isActive ? colorClass : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                              />
                            )
                          })}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <div className={`flex items-center gap-2 ${password.length >= 6 ? 'text-green-600 dark:text-green-400' : ''}`}>
                            <svg className={`w-4 h-4 ${password.length >= 6 ? 'opacity-100' : 'opacity-30'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            At least 6 characters
                          </div>
                          <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}`}>
                            <svg className={`w-4 h-4 ${password.length >= 8 ? 'opacity-100' : 'opacity-30'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            At least 8 characters (recommended)
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                      </span>
                    ) : (
                      'Create account'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="verify-email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-6"
              >
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-blue-500 rounded-full blur-xl"
                  />
                </div>
              </motion.div>

              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                Check your email
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                We've sent a verification link to
              </p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-8 break-all">
                {email}
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  Click the link in the email to verify your account and continue.
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  💡 <strong>Tip:</strong> Check your spam/junk folder if you don't see the email within a few minutes.
                </p>
              </div>

              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-2">
                  📋 Not receiving the email? Troubleshooting tips
                </summary>
                <div className="mt-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">1. Check Spam/Junk Folder</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Emails from Supabase sometimes end up in spam. Look for emails from "noreply@supabase.co" or similar.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">2. Verify Supabase Configuration</p>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Make sure email confirmations are enabled in your Supabase Dashboard:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-2">
                      <li>Go to <a href="https://supabase.com/dashboard/project/pwjenlkyvckavtponsfs" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Supabase Dashboard</a></li>
                      <li>Navigate to <strong>Authentication</strong> → <strong>Providers</strong> → <strong>Email</strong></li>
                      <li>Ensure <strong>"Enable email confirmations"</strong> is turned ON</li>
                      <li>Save the changes</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">3. Wait a Few Minutes</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Email delivery can take 1-5 minutes. If it's been longer, try resending.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">4. Check Console Logs</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Open your browser's developer console (F12) and look for email-related logs to see if the email was sent.
                    </p>
                  </div>
                </div>
              </details>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800 mb-4"
                >
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </motion.div>
              )}

              {emailSent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800 mb-4"
                >
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Verification email sent successfully!
                  </p>
                </motion.div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  disabled={resendingEmail}
                  className="w-full py-3 px-4 border border-blue-600 dark:border-blue-400 text-sm font-medium rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {resendingEmail ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Resend verification email'
                  )}
                </button>

                <Link
                  href="/auth"
                  className="block w-full py-3 px-4 text-sm font-medium text-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Back to login
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}


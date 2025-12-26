import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  // Landing page for non-authenticated users
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="z-10 max-w-6xl w-full items-center justify-between text-center relative">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-scale-in">
            <span className="text-white font-bold text-2xl">TP</span>
          </div>
        </div>
        
        <h1 className="text-6xl sm:text-7xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-fade-in-up">
          TrainPulse
        </h1>
        
        <p className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Your Fitness Business, Simplified
        </p>
        
        <p className="text-lg sm:text-xl mb-4 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          The all-in-one platform that personal trainers love
        </p>
        
        <p className="text-base sm:text-lg mb-12 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          Manage clients, schedules, workouts, and payments in one powerful platform. 
          Built by trainers, for trainers. Scale your business effortlessly.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Link
            href="/auth/signin"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-xl hover:shadow-2xl hover:scale-105 text-lg"
          >
            Start Free Trial
          </Link>
          <Link
            href="/auth/signup"
            className="px-8 py-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all font-semibold shadow-lg hover:shadow-xl border border-gray-200 dark:border-slate-700 text-lg"
          >
            Create Account
          </Link>
        </div>
        
        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-700/50">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Client Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track progress, history, and engagement effortlessly</p>
          </div>
          
          <div className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-700/50">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Smart Scheduling</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Never miss an appointment with automated reminders</p>
          </div>
          
          <div className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-700/50">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Easy Payments</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Streamline invoicing and get paid faster</p>
          </div>
        </div>
      </div>
    </main>
  )
}


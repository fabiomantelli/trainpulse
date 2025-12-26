import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import StructuredData from '@/components/seo/StructuredData'
import { getLandingPageStructuredData, getFAQStructuredData } from '@/lib/seo/landingPageStructuredData'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Personal Trainer Software | Fitness Business Management - TrainPulse',
  description: 'The all-in-one personal trainer software for fitness professionals in the USA. Manage clients, schedules, workouts, and payments effortlessly. Built by trainers, for trainers.',
  keywords: [
    'personal trainer software',
    'fitness business management',
    'trainer client management software',
    'personal trainer scheduling app',
    'fitness trainer CRM',
    'personal training business software',
    'trainer appointment scheduling',
    'fitness business software USA',
  ],
  alternates: {
    canonical: 'https://trainpulse.fit',
  },
}

export default async function Home({
  searchParams,
}: {
  searchParams: { code?: string | string[]; [key: string]: string | string[] | undefined }
}) {
  const code = Array.isArray(searchParams?.code) ? searchParams.code[0] : searchParams?.code

  // If code parameter is present, redirect to /auth/callback to handle authentication
  if (code && typeof code === 'string') {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}`)
  }

  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  // Landing page for non-authenticated users
  const structuredData = getLandingPageStructuredData()
  const faqData = getFAQStructuredData()

  return (
    <>
      <StructuredData data={structuredData} />
      <StructuredData data={faqData} />
      <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
        <InstallPrompt />
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
          Personal Trainer Software for Your Fitness Business
        </p>
        
        <p className="text-lg sm:text-xl mb-4 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          The all-in-one fitness business management platform that personal trainers love
        </p>
        
        <p className="text-base sm:text-lg mb-12 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          Manage clients, schedules, workouts, and payments in one powerful personal trainer software. 
          Built by trainers, for trainers. Scale your fitness business effortlessly in the USA.
        </p>
        
        <div className="flex flex-col gap-4 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Link
            href="/auth/signup"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-xl hover:shadow-2xl hover:scale-105 text-lg"
          >
            Get Started
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              href="/auth"
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              Sign in
            </Link>
          </p>
        </div>
        
        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-700/50">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Client Management</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track client progress, history, and engagement effortlessly with our trainer client management software</p>
          </div>
          
          <div className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-700/50">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Smart Scheduling</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Personal trainer scheduling app with automated reminders. Never miss an appointment</p>
          </div>
          
          <div className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-700/50">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Easy Payments</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Streamline invoicing and get paid faster with integrated payment processing</p>
          </div>
        </div>

        {/* How It Works Section */}
        <section className="mt-20 w-full max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Sign Up Free</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create your account in seconds. No credit card required to get started.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Add Your Clients</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Import or add your clients. Track their progress and engagement easily.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Schedule Appointments</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your calendar and set up recurring appointments with reminders.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                4
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Grow Your Business</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create workouts, send invoices, and manage payments all in one place.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-20 w-full max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <details className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-700/50 p-6">
              <summary className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                What is TrainPulse?
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                TrainPulse is a comprehensive personal trainer software and fitness business management platform designed specifically for fitness professionals. It helps trainers manage clients, schedules, workouts, and payments all in one place.
              </p>
            </details>
            <details className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-700/50 p-6">
              <summary className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                Who can use TrainPulse?
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                TrainPulse is designed for personal trainers, fitness coaches, and independent fitness professionals who want to streamline their business operations. It's perfect for trainers managing their own clients and schedules.
              </p>
            </details>
            <details className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-700/50 p-6">
              <summary className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                Do I need to install software to use TrainPulse?
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                No installation required! TrainPulse is a web-based application that works in your browser. You can also install it as a Progressive Web App (PWA) on your mobile device or desktop for app-like experience and offline access.
              </p>
            </details>
            <details className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-700/50 p-6">
              <summary className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                Can I manage my clients and appointments with TrainPulse?
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Yes! TrainPulse includes comprehensive client management features where you can track client information, history, and engagement. You can also schedule appointments, manage your calendar, and set up automated reminders to never miss a session.
              </p>
            </details>
            <details className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-700/50 p-6">
              <summary className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                Does TrainPulse work offline?
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Yes, TrainPulse works offline! As a Progressive Web App, you can access your cached data even without an internet connection. Perfect for viewing client information and schedules when you're at the gym without WiFi.
              </p>
            </details>
            <details className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-700/50 p-6">
              <summary className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                How do I get started with TrainPulse?
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Getting started is easy! Simply create a free account, and you'll have immediate access to all features. You can start adding clients, creating workouts, and scheduling appointments right away.
              </p>
            </details>
          </div>
        </section>

        {/* Final CTA */}
        <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <Link
            href="/auth/signup"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-xl hover:shadow-2xl hover:scale-105 text-lg"
          >
            Start Your Free Account Today
          </Link>
        </div>
      </div>
    </main>
    </>
  )
}


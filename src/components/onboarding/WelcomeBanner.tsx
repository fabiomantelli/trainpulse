'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { differenceInDays } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

type Profile = Database['public']['Tables']['profiles']['Row']

interface WelcomeBannerProps {
  profile: Profile
}

interface OnboardingStep {
  id: string
  label: string
  completed: boolean
  link: string
}

export default function WelcomeBanner({ profile }: WelcomeBannerProps) {
  const supabase = createClient()
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [earlyAdopterCount, setEarlyAdopterCount] = useState<number | null>(null)
  const [clientsCount, setClientsCount] = useState(0)
  const [workoutsCount, setWorkoutsCount] = useState(0)
  const [isDismissed, setIsDismissed] = useState(false)

  const createdDate = profile.created_at ? new Date(profile.created_at) : new Date()
  const daysSinceSignup = differenceInDays(new Date(), createdDate)
  const isNewUser = daysSinceSignup < 7
  
  // Check if trial has expired
  const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const isTrialExpired = trialEndsAt ? trialEndsAt < new Date() : false
  
  // Check if user has ever had an active subscription (even if cancelled now)
  const hasHadSubscription = !!profile.stripe_subscription_id || profile.subscription_status === 'active' || profile.subscription_status === 'cancelled'
  
  // Don't show banner if subscription is active, trial expired, or user has had subscription before
  const shouldShowBanner = isNewUser && !isDismissed && profile.subscription_status !== 'active' && !isTrialExpired && !hasHadSubscription

  // Check localStorage on mount to see if banner was already dismissed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = `welcome_banner_dismissed_${profile.id}`
      const dismissed = localStorage.getItem(storageKey) === 'true'
      if (dismissed) {
        setIsDismissed(true)
      }
    }
  }, [profile.id])

  useEffect(() => {
    if (!shouldShowBanner) return

    async function loadData() {
      // Load early adopter count
      const { data: eaCount } = await supabase.rpc('get_early_adopter_count')
      if (eaCount !== null) setEarlyAdopterCount(eaCount)

      // Load clients count
      const { count: clients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('trainer_id', profile.id)
      setClientsCount(clients || 0)

      // Load workouts count
      const { count: workouts } = await supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('trainer_id', profile.id)
      setWorkoutsCount(workouts || 0)

      // Build onboarding steps (MVP: Stripe Connect removed)
      const onboardingSteps: OnboardingStep[] = [
        {
          id: 'client',
          label: 'Add your first client',
          completed: (clients || 0) > 0,
          link: '/clients/new',
        },
        {
          id: 'appointment',
          label: 'Schedule your first appointment',
          completed: false, // We'll check this if needed
          link: '/appointments/new',
        },
        {
          id: 'workout',
          label: 'Create your first workout',
          completed: (workouts || 0) > 0,
          link: '/workouts/new',
        },
      ]

      setSteps(onboardingSteps)
    }

    loadData()
  }, [profile, isNewUser, supabase])

  const handleDismiss = () => {
    setIsDismissed(true)
    if (typeof window !== 'undefined') {
      const storageKey = `welcome_banner_dismissed_${profile.id}`
      localStorage.setItem(storageKey, 'true')
    }
  }

  // Don't show banner if conditions are not met
  if (!shouldShowBanner) {
    return null
  }

  const completedSteps = steps.filter((s) => s.completed).length
  const totalSteps = steps.length
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="mb-6 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 shadow-sm overflow-hidden"
        >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              Welcome to TrainPulse! 🎉
            </h2>
            {earlyAdopterCount !== null && earlyAdopterCount < 100 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                Early Adopter: {100 - earlyAdopterCount} spots left
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            You have <strong>30 days free</strong> to explore all features. Get started with these
            quick steps:
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Dismiss welcome banner"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400 mb-2">
          <span>Setup Progress</span>
          <span className="font-semibold">
            {completedSteps} of {totalSteps} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.link}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              step.completed
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            {step.completed ? (
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <div className="w-5 h-5 border-2 border-gray-300 dark:border-slate-600 rounded flex-shrink-0" />
            )}
            <span
              className={`text-sm ${
                step.completed
                  ? 'text-green-800 dark:text-green-200 line-through'
                  : 'text-gray-700 dark:text-slate-300 font-medium'
              }`}
            >
              {step.label}
            </span>
            {!step.completed && (
              <svg
                className="w-4 h-4 text-gray-400 ml-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </Link>
        ))}
      </div>

      {/* Early Adopter CTA */}
      {earlyAdopterCount !== null && earlyAdopterCount < 100 && !profile.is_early_adopter && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
            🎯 Limited Time Offer
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
            Lock in Early Adopter pricing at <strong>$19/month</strong> forever! Only{' '}
            {100 - earlyAdopterCount} spots remaining. After that, the price will be $29/month.
          </p>
          <Link
            href="/subscription"
            className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Upgrade Now - $19/month
          </Link>
        </div>
      )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}




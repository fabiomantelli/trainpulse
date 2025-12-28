'use client'

import { Database } from '@/types/database.types'
import { differenceInDays, isPast } from 'date-fns'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = Database['public']['Tables']['profiles']['Row']

interface FeatureHighlightsProps {
  profile: Profile
}

export default function FeatureHighlights({ profile }: FeatureHighlightsProps) {
  const supabase = createClient()
  const [earlyAdopterCount, setEarlyAdopterCount] = useState<number | null>(null)

  const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const isTrialing = profile.subscription_status === 'trialing'
  const isActive = profile.subscription_status === 'active'
  const isEarlyAdopter = profile.is_early_adopter || false

  useEffect(() => {
    async function fetchEarlyAdopterCount() {
      const { data, error } = await supabase.rpc('get_early_adopter_count')
      if (!error && data !== null) {
        setEarlyAdopterCount(data)
      }
    }
    fetchEarlyAdopterCount()
  }, [])

  // Only show during trial
  if (!isTrialing || isActive || !trialEndsAt) {
    return null
  }

  const daysRemaining = differenceInDays(trialEndsAt, new Date())
  const isExpired = isPast(trialEndsAt)

  if (isExpired) {
    return null // Show subscription banner instead
  }

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      title: 'Unlimited Clients',
      description: 'Manage as many clients as you need',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      title: 'Email Confirmations',
      description: 'Automatic appointment confirmations sent to clients',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      title: 'Invoice Management',
      description: 'Create and track invoices for your clients',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: 'Automated Reminders',
      description: 'Birthday notifications and appointment reminders',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      title: 'Priority Support',
      description: 'Get help when you need it',
    },
  ]

  const getPricingMessage = () => {
    if (isEarlyAdopter) {
      return '$19/month (Early Adopter)'
    }
    if (earlyAdopterCount !== null && earlyAdopterCount < 100) {
      return `$19/month (Early Adopter - ${100 - earlyAdopterCount} left) or $29/month`
    }
    return '$29/month'
  }

  return (
    <div className="mb-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">
            Unlock All Features After Trial
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in your free trial
          </p>
        </div>
        {earlyAdopterCount !== null && earlyAdopterCount < 100 && !isEarlyAdopter && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            {100 - earlyAdopterCount} Early Adopter spots left
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700"
          >
            <div className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">
              {feature.icon}
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-slate-100 mb-1">
                {feature.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-slate-400">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-lg border border-purple-200 dark:border-purple-800">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1">
            Upgrade now to lock in your price
          </p>
          <p className="text-xs text-gray-600 dark:text-slate-400">
            {isEarlyAdopter
              ? 'You have Early Adopter pricing locked in at $19/month forever!'
              : earlyAdopterCount !== null && earlyAdopterCount < 100
                ? `Lock in Early Adopter pricing at $19/month forever. Only ${100 - earlyAdopterCount} spots remaining!`
                : 'Continue with full access to all features'}
          </p>
        </div>
        <Link
          href="/subscription"
          className="w-full sm:w-auto px-2 py-3 sm:px-6 sm:py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs sm:text-base font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-center whitespace-normal sm:whitespace-nowrap break-words leading-tight"
        >
          Upgrade - {getPricingMessage()}
        </Link>
      </div>
    </div>
  )
}




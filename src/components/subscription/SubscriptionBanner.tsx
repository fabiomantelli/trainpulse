'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/types/database.types'
import { differenceInDays, isPast } from 'date-fns'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Profile = Database['public']['Tables']['profiles']['Row']

interface SubscriptionBannerProps {
  profile: Profile
}

export default function SubscriptionBanner({ profile }: SubscriptionBannerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [earlyAdopterCount, setEarlyAdopterCount] = useState<number | null>(null)
  const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const isTrialing = profile.subscription_status === 'trialing'
  const isActive = profile.subscription_status === 'active'
  const isPastDue = profile.subscription_status === 'past_due'
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

  // Determine pricing message
  const getPricingMessage = () => {
    if (isEarlyAdopter) {
      return '$19/month (Early Adopter - locked in forever)'
    }
    if (earlyAdopterCount !== null && earlyAdopterCount < 100) {
      return `$19/month (Early Adopter - ${100 - earlyAdopterCount} spots left) or $29/month`
    }
    return '$29/month'
  }

  // Don't show banner if subscription is active
  if (isActive) {
    return null
  }

  // Show banner if trial is expiring soon or expired
  if (isTrialing && trialEndsAt) {
    const daysRemaining = differenceInDays(trialEndsAt, new Date())
    const isExpired = isPast(trialEndsAt)

    if (isExpired || daysRemaining <= 7) {
      return (
        <div
          className={`border-l-4 ${
            isExpired
              ? 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-600'
          } p-4 mb-6`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className={`h-5 w-5 ${
                  isExpired
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3
                className={`text-sm font-medium ${
                  isExpired
                    ? 'text-red-800 dark:text-red-200'
                    : 'text-yellow-800 dark:text-yellow-200'
                }`}
              >
                {isExpired
                  ? 'Your free trial has ended'
                  : `Your free trial ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`}
              </h3>
              <div
                className={`mt-2 text-sm ${
                  isExpired
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-yellow-700 dark:text-yellow-300'
                }`}
              >
                <p>
                  {isExpired
                    ? `Upgrade to continue using TrainPulse. ${getPricingMessage()}.`
                    : `Upgrade now to continue using TrainPulse after your trial ends. ${getPricingMessage()}.`}
                </p>
              </div>
              <div className="mt-4">
                <Link
                  href="/subscription"
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                    isExpired
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  }`}
                >
                  {isExpired ? 'Upgrade Now' : 'Upgrade to Paid Plan'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  // Show banner for past due
  if (isPastDue) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-600 dark:text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Payment Failed
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>
                Your last payment could not be processed. Please update your payment method to
                continue using TrainPulse.
              </p>
            </div>
            <div className="mt-4">
              <Link
                href="/subscription"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-red-600 hover:bg-red-700 text-white"
              >
                Update Payment Method
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}


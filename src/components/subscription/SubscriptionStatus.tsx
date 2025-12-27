'use client'

import { Database } from '@/types/database.types'
import { format, differenceInDays, isPast, isFuture } from 'date-fns'

type Profile = Database['public']['Tables']['profiles']['Row']

interface SubscriptionStatusProps {
  profile: Profile
}

export default function SubscriptionStatus({ profile }: SubscriptionStatusProps) {
  const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const isTrialing = profile.subscription_status === 'trialing'
  const isActive = profile.subscription_status === 'active'
  const isCancelled = profile.subscription_status === 'cancelled'
  const isPastDue = profile.subscription_status === 'past_due'

  const getStatusBadge = () => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Active
        </span>
      )
    }

    if (isTrialing && trialEndsAt) {
      const daysRemaining = differenceInDays(trialEndsAt, new Date())
      const isExpired = isPast(trialEndsAt)

      if (isExpired) {
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Trial Expired
          </span>
        )
      }

      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          Trial - {daysRemaining} days left
        </span>
      )
    }

    if (isCancelled) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          Cancelled
        </span>
      )
    }

    if (isPastDue) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          Payment Failed
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
        {profile.subscription_status}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
          Subscription Status
        </h3>
        {getStatusBadge()}
      </div>

      {isTrialing && trialEndsAt && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {isPast(trialEndsAt)
                  ? 'Your free trial has ended'
                  : `Your free trial ends on ${format(trialEndsAt, 'MMMM d, yyyy')}`}
              </p>
              {!isPast(trialEndsAt) && (
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {differenceInDays(trialEndsAt, new Date())} days remaining
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isActive && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            Your subscription is active. You're all set!
          </p>
        </div>
      )}

      {isPastDue && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Your last payment failed. Please update your payment method to continue using TrainPulse.
          </p>
        </div>
      )}

      {isCancelled && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-800 dark:text-gray-200">
            Your subscription has been cancelled. You'll continue to have access until the end of your
            current billing period.
          </p>
        </div>
      )}
    </div>
  )
}


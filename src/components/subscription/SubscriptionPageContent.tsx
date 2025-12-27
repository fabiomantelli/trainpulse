'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/database.types'
import SubscriptionStatus from './SubscriptionStatus'
import BackButton from '@/components/layout/BackButton'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

type Profile = Database['public']['Tables']['profiles']['Row']

interface SubscriptionPageContentProps {
  profile: Profile
}

export default function SubscriptionPageContent({
  profile,
}: SubscriptionPageContentProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [earlyAdopterCount, setEarlyAdopterCount] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchEarlyAdopterCount() {
      const { data, error } = await supabase.rpc('get_early_adopter_count')
      if (!error && data !== null) {
        setEarlyAdopterCount(data)
      }
    }
    fetchEarlyAdopterCount()
  }, [])

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error)
      toast.error(error.message || 'Failed to start checkout')
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/subscription/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open customer portal')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Error opening portal:', error)
      toast.error(error.message || 'Failed to open customer portal')
      setLoading(false)
    }
  }

  const isTrialing = profile.subscription_status === 'trialing'
  const isActive = profile.subscription_status === 'active'
  const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const isTrialExpired = trialEndsAt && trialEndsAt < new Date()

  return (
    <>
      <BackButton href="/dashboard" />
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            Subscription
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Manage your TrainPulse subscription
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-6 lg:p-8">
          {/* Early Adopter Badge */}
          {profile.is_early_adopter && (
            <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0-.723 1.745 3.066 3.066 0-2.812 2.812 3.066 3.066 0-1.745.723 3.066 3.066 0-3.976 0 3.066 3.066 0-1.745-.723 3.066 3.066 0-2.812-2.812 3.066 3.066 0-.723-1.745 3.066 3.066 0 0-3.976 3.066 3.066 0.723-1.745 3.066 3.066 0 2.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    Early Adopter
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    You're locked in at $19/month forever! 🎉
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Early Adopter Availability Message */}
          {!profile.is_early_adopter &&
            earlyAdopterCount !== null &&
            earlyAdopterCount < 100 && (
              <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      Limited Time: Early Adopter Pricing Available
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Only {100 - earlyAdopterCount} spots left at $19/month (locked in forever). After
                      that, the price will be $29/month.
                    </p>
                  </div>
                </div>
              </div>
            )}

          <SubscriptionStatus profile={profile} />

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
              Plan Details
            </h3>
            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    TrainPulse Monthly
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                    Full access to all features
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-2">
                    {profile.is_early_adopter ? (
                      <>
                        <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                          $19
                        </div>
                        <div className="text-sm text-gray-500 dark:text-slate-400 line-through">
                          $29
                        </div>
                      </>
                    ) : (
                      <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                        $29
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-slate-400">per month</div>
                  {profile.is_early_adopter && (
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      Early Adopter Price
                    </div>
                  )}
                </div>
              </div>

              <ul className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Unlimited clients
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Stripe Connect integration
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Automatic tax calculation
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Priority support
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row gap-4">
              {isTrialing && (isTrialExpired || !isActive) && (
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? 'Loading...'
                    : profile.is_early_adopter
                      ? 'Upgrade to Paid Plan - $19/month'
                      : earlyAdopterCount !== null && earlyAdopterCount < 100
                        ? `Upgrade Now - $19/month (Early Adopter)`
                        : 'Upgrade to Paid Plan - $29/month'}
                </button>
              )}

              {isActive && (
                <button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-slate-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Manage Subscription'}
                </button>
              )}

              {profile.subscription_status === 'past_due' && (
                <button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Update Payment Method'}
                </button>
              )}
            </div>

            <p className="mt-4 text-xs text-gray-500 dark:text-slate-400">
              You can cancel your subscription at any time. Cancellation takes effect at the end of
              your current billing period.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}


'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import SubscriptionBanner from '@/components/subscription/SubscriptionBanner'
import WelcomeBanner from '@/components/onboarding/WelcomeBanner'
import FeatureHighlights from '@/components/growth/FeatureHighlights'
import { format, startOfDay, endOfDay, isToday } from 'date-fns'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Database } from '@/types/database.types'
import RevenueCharts from './RevenueCharts'

type Stats = {
  total_clients: number
  active_clients: number
  total_appointments: number
  upcoming_appointments: number
  total_revenue: number
  monthly_revenue: number
}

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  client_name?: string
}

type Payment = Database['public']['Tables']['payments']['Row'] & {
  client_name?: string
}

type Profile = Database['public']['Tables']['profiles']['Row']

export default function DashboardContent({
  userId,
  profile,
}: {
  userId: string
  profile?: Profile
}) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function loadStats() {
      try {
        const { data, error } = await (supabase as any).rpc('get_trainer_stats', {
          p_trainer_id: userId,
        })

        if (error) {
          console.error('Error loading stats:', error)
          // Set default stats on error
          setStats({
            total_clients: 0,
            active_clients: 0,
            total_appointments: 0,
            upcoming_appointments: 0,
            total_revenue: 0,
            monthly_revenue: 0,
          })
        } else if (data && data.length > 0) {
          console.log('Loaded stats:', data[0])
          const statsData = data[0] as any
          // Convert DECIMAL values to numbers (PostgreSQL returns DECIMAL as string)
          setStats({
            total_clients: Number(statsData.total_clients) || 0,
            active_clients: Number(statsData.active_clients) || 0,
            total_appointments: Number(statsData.total_appointments) || 0,
            upcoming_appointments: Number(statsData.upcoming_appointments) || 0,
            total_revenue: Number(statsData.total_revenue) || 0,
            monthly_revenue: Number(statsData.monthly_revenue) || 0,
          })
        } else {
          console.log('No stats data returned')
          // Set default stats if no data
          setStats({
            total_clients: 0,
            active_clients: 0,
            total_appointments: 0,
            upcoming_appointments: 0,
            total_revenue: 0,
            monthly_revenue: 0,
          })
        }
      } catch (err) {
        console.error('Unexpected error loading stats:', err)
        setStats({
          total_clients: 0,
          active_clients: 0,
          total_appointments: 0,
          upcoming_appointments: 0,
          total_revenue: 0,
          monthly_revenue: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadStats()
      loadTodayAppointments()
      loadRecentPayments()
    }

    // Set up real-time subscriptions
    const appointmentsChannel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `trainer_id=eq.${userId}`,
        },
        () => {
          // Reload data when appointments change
          loadStats()
          loadTodayAppointments()
        }
      )
      .subscribe()

    const paymentsChannel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `trainer_id=eq.${userId}`,
        },
        () => {
          // Reload data when payments change
          loadStats()
          loadRecentPayments()
        }
      )
      .subscribe()

    const clientsChannel = supabase
      .channel('clients-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients',
          filter: `trainer_id=eq.${userId}`,
        },
        () => {
          // Reload stats when clients change
          loadStats()
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(appointmentsChannel)
      supabase.removeChannel(paymentsChannel)
      supabase.removeChannel(clientsChannel)
    }
  }, [userId, supabase])

  async function loadTodayAppointments() {
    try {
      const todayStart = startOfDay(new Date())
      const todayEnd = endOfDay(new Date())

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients:client_id (
            name
          )
        `)
        .eq('trainer_id', userId)
        .gte('scheduled_at', todayStart.toISOString())
        .lte('scheduled_at', todayEnd.toISOString())
        .neq('status', 'cancelled')
        .order('scheduled_at', { ascending: true })
        .limit(10)

      if (!error && data) {
        const appointmentsWithClientName = data.map((apt: any) => ({
          ...apt,
          client_name: apt.clients?.name || 'Unknown Client',
        }))
        setTodayAppointments(appointmentsWithClientName)
      }
    } catch (error) {
      console.error('Error loading today appointments:', error)
    }
  }

  async function loadRecentPayments() {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          clients:client_id (
            name
          )
        `)
        .eq('trainer_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error loading recent payments:', error)
        setRecentPayments([])
        return
      }

      if (data) {
        console.log('Loaded payments:', data.length, data)
        const paymentsWithClientName = data.map((payment: any) => ({
          ...payment,
          amount: Number(payment.amount) || 0, // Ensure amount is a number
          client_name: payment.clients?.name || 'Unknown Client',
        }))
        setRecentPayments(paymentsWithClientName)
      } else {
        console.log('No payments data returned')
        setRecentPayments([])
      }
    } catch (error) {
      console.error('Error loading recent payments:', error)
      setRecentPayments([])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const getSubscriptionStatus = () => {
    if (!profile) return null
    
    const isTrialing = profile.subscription_status === 'trialing'
    const isActive = profile.subscription_status === 'active'
    const isPastDue = profile.subscription_status === 'past_due'
    const isCancelled = profile.subscription_status === 'cancelled'
    const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
    const isTrialExpired = trialEndsAt ? trialEndsAt < new Date() : false
    const hasHadSubscription = !!profile.stripe_subscription_id || isActive || isCancelled
    
    // Only show trial days if:
    // 1. Status is trialing
    // 2. Trial hasn't expired
    // 3. User hasn't had a subscription before
    const shouldShowTrial = isTrialing && !isTrialExpired && !hasHadSubscription
    const daysRemaining = shouldShowTrial && trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null
    
    return { isTrialing, isActive, isPastDue, isCancelled, daysRemaining, trialEndsAt, isTrialExpired, hasHadSubscription, shouldShowTrial }
  }

  const subscriptionStatus = getSubscriptionStatus()

  return (
    <>
      {profile && <SubscriptionBanner profile={profile} />}
      {profile && <WelcomeBanner profile={profile} />}
      {profile && <FeatureHighlights profile={profile} />}
      
      {/* Subscription Status Card */}
      {profile && subscriptionStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-2"
        >
          <div className="bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200/50 dark:border-slate-700/30 p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-slate-100">
                      Subscription
                    </h3>
                    {subscriptionStatus.isActive && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </span>
                    )}
                    {subscriptionStatus.shouldShowTrial && subscriptionStatus.daysRemaining !== null && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Trial - {subscriptionStatus.daysRemaining} days left
                      </span>
                    )}
                    {subscriptionStatus.isTrialing && !subscriptionStatus.shouldShowTrial && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        Trial Expired
                      </span>
                    )}
                    {subscriptionStatus.isPastDue && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Payment Failed
                      </span>
                    )}
                    {subscriptionStatus.isCancelled && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        Cancelled
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 break-words">
                    {profile.is_early_adopter 
                      ? 'Early Adopter - $19/month'
                      : subscriptionStatus.shouldShowTrial && subscriptionStatus.daysRemaining !== null && subscriptionStatus.daysRemaining > 7
                        ? 'Free trial active'
                        : subscriptionStatus.isTrialing && !subscriptionStatus.shouldShowTrial
                          ? 'Trial expired - Upgrade required'
                          : '$29/month'}
                  </p>
                </div>
              </div>
              <Link
                href="/subscription"
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md text-center sm:text-left"
              >
                {subscriptionStatus.isActive ? 'Manage' : subscriptionStatus.isTrialing ? 'Upgrade' : 'View Details'}
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-2"
      >
          <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 bg-clip-text text-transparent mb-0.5">
            Dashboard
          </h1>
          <p className="text-xs text-gray-600 dark:text-slate-300">Welcome back! Here's your business overview</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 mb-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200/50 dark:border-slate-700/30 p-3 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-slate-700/40 hover:border-blue-300 dark:hover:border-slate-600/50 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-3">
              <div className="flex-1">
                <h3 className="text-xs font-medium text-gray-500 dark:text-slate-300 mb-1 uppercase tracking-wide">Total Clients</h3>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {stats?.total_clients || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-9 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/20">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200/50 dark:border-slate-700/30 p-3 hover:shadow-xl dark:hover:shadow-slate-700/40 hover:shadow-green-500/10 dark:hover:shadow-green-500/10 hover:border-green-300 dark:hover:border-slate-600/50 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-3">
              <div className="flex-1">
                <h3 className="text-xs font-medium text-gray-500 dark:text-slate-300 mb-1 uppercase tracking-wide">
                  Active Clients
                </h3>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {stats?.active_clients || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-9 lg:w-10 lg:h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/20">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200/50 dark:border-slate-700/30 p-3 hover:shadow-xl dark:hover:shadow-slate-700/40 hover:shadow-purple-500/10 dark:hover:shadow-purple-500/10 hover:border-purple-300 dark:hover:border-slate-600/50 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-3">
              <div className="flex-1">
                <h3 className="text-xs font-medium text-gray-500 dark:text-slate-300 mb-1 uppercase tracking-wide">
                  Upcoming Appointments
                </h3>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {stats?.upcoming_appointments || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-9 lg:w-10 lg:h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/20">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="group bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200/50 dark:border-slate-700/30 p-3 hover:shadow-xl dark:hover:shadow-slate-700/40 hover:shadow-yellow-500/10 dark:hover:shadow-yellow-500/10 hover:border-yellow-300 dark:hover:border-slate-600/50 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-3">
              <div className="flex-1">
                <h3 className="text-xs font-medium text-gray-500 dark:text-slate-300 mb-1 uppercase tracking-wide">
                  Total Revenue
                </h3>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-slate-100">
                  ${(stats?.total_revenue || 0).toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-9 lg:w-10 lg:h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-yellow-500/20">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="group bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200/50 dark:border-slate-700/30 p-3 hover:shadow-xl dark:hover:shadow-slate-700/40 hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-slate-600/50 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-3">
              <div className="flex-1">
                <h3 className="text-xs font-medium text-gray-500 dark:text-slate-300 mb-1 uppercase tracking-wide">
                  Monthly Revenue
                </h3>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-slate-100">
                  ${(stats?.monthly_revenue || 0).toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-9 lg:w-10 lg:h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-500/20">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
          {/* Today's Schedule */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200/50 dark:border-slate-700/30 p-2.5 hover:shadow-xl dark:hover:shadow-slate-700/40 hover:border-blue-200/50 dark:hover:border-slate-600/50 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Today's Schedule</h2>
              <Link
                href="/appointments"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                View All
              </Link>
            </div>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-6">
                <svg
                  className="w-12 h-12 text-gray-400 dark:text-slate-600 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">
                  No appointments scheduled for today
                </p>
                <Link
                  href="/appointments/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Schedule Appointment
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto custom-scrollbar">
                {todayAppointments.map((apt) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      href={`/appointments/${apt.id}`}
                      className="block p-2 border border-gray-200/50 dark:border-slate-700/30 rounded-lg hover:bg-blue-50/50 dark:hover:bg-slate-700/30 hover:border-blue-200 dark:hover:border-slate-600/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
                    >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-100">
                          {format(new Date(apt.scheduled_at), 'h:mm a')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-slate-300">{apt.client_name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {apt.duration_minutes} minutes
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          apt.status === 'scheduled'
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                            : apt.status === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                            : 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Payments */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200/50 dark:border-slate-700/30 p-2.5 hover:shadow-xl dark:hover:shadow-slate-700/40 hover:border-green-200/50 dark:hover:border-slate-600/50 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Recent Payments</h2>
              <Link
                href="/invoices"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                View All
              </Link>
            </div>
            {recentPayments.length === 0 ? (
              <div className="text-center py-6">
                <svg
                  className="w-12 h-12 text-gray-400 dark:text-slate-600 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">
                  No recent payments
                </p>
                <Link
                  href="/invoices/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Invoice
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto custom-scrollbar">
                {recentPayments.map((payment) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-2 border border-gray-200/50 dark:border-slate-700/30 rounded-lg hover:bg-green-50/50 dark:hover:bg-slate-700/30 hover:border-green-200 dark:hover:border-slate-600/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-100">
                          ${payment.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-slate-300">{payment.client_name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {format(new Date(payment.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Revenue Charts */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mb-2"
        >
          <RevenueCharts trainerId={userId} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200/50 dark:border-slate-700/30 p-3 hover:shadow-lg dark:hover:shadow-slate-700/40 transition-shadow"
        >
          <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-2">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <Link
              href="/clients"
              className="group relative px-5 py-3 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 text-center overflow-hidden text-sm"
            >
              <span className="relative z-10">Manage Clients</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link
              href="/appointments"
              className="group relative px-5 py-3 bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300 text-center overflow-hidden text-sm"
            >
              <span className="relative z-10">View Calendar</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link
              href="/workouts"
              className="group relative px-5 py-3 bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-300 text-center overflow-hidden text-sm"
            >
              <span className="relative z-10">Create Workout</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link
              href="/invoices/new"
              className="group relative px-5 py-3 bg-gradient-to-r from-blue-500 via-cyan-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-2xl hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-300 text-center overflow-hidden text-sm"
            >
              <span className="relative z-10">Create Invoice</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>
        </motion.div>
    </>
  )
}


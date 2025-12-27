'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SocialProof() {
  const supabase = createClient()
  const [stats, setStats] = useState<{
    totalTrainers: number | null
    activeTrainers: number | null
    totalInvoices: number | null
  }>({
    totalTrainers: null,
    activeTrainers: null,
    totalInvoices: null,
  })

  useEffect(() => {
    async function loadStats() {
      try {
        // Get total trainers count
        const { count: totalTrainers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        // Get active trainers (with active subscription)
        const { count: activeTrainers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_status', 'active')

        // Get total invoices created (this month)
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const { count: totalInvoices } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString())

        setStats({
          totalTrainers: totalTrainers || 0,
          activeTrainers: activeTrainers || 0,
          totalInvoices: totalInvoices || 0,
        })
      } catch (error) {
        console.error('Error loading social proof stats:', error)
      }
    }

    loadStats()
  }, [])

  // Don't show if no data
  if (stats.totalTrainers === null) {
    return null
  }

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k+`
    }
    return num.toString()
  }

  return (
    <div className="mb-6 bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700/30 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-center gap-6 text-center">
        {/* Total Trainers */}
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            {formatNumber(stats.totalTrainers)}
          </div>
          <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">
            Trainers using TrainPulse
          </div>
        </div>

        {/* Active Trainers */}
        {stats.activeTrainers !== null && stats.activeTrainers > 0 && (
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatNumber(stats.activeTrainers)}
            </div>
            <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">
              Active Subscribers
            </div>
          </div>
        )}

        {/* Monthly Invoices */}
        {stats.totalInvoices !== null && stats.totalInvoices > 0 && (
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatNumber(stats.totalInvoices)}
            </div>
            <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">
              Invoices this month
            </div>
          </div>
        )}

        {/* Trust Badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700">
          <svg
            className="w-5 h-5 text-green-600 dark:text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0-.723 1.745 3.066 3.066 0-2.812 2.812 3.066 3.066 0-1.745.723 3.066 3.066 0-3.976 0 3.066 3.066 0-1.745-.723 3.066 3.066 0-2.812-2.812 3.066 3.066 0-.723-1.745 3.066 3.066 0 0-3.976 3.066 3.066 0.723-1.745 3.066 3.066 0 2.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Trusted by fitness professionals
          </span>
        </div>
      </div>
    </div>
  )
}


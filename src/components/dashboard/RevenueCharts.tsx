'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useTheme } from '@/contexts/ThemeContext'

interface RevenueChartsProps {
  trainerId: string
}

// Custom Tooltip component that respects dark mode
const CustomTooltip = ({ active, payload, label, labelFormatter, isBarChart = false }: any) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: isDark ? 'rgb(30, 41, 59)' : 'rgb(255, 255, 255)',
          border: `1px solid ${isDark ? 'rgb(51, 65, 85)' : '#e5e7eb'}`,
          borderRadius: '8px',
          padding: '8px 12px',
          color: isDark ? 'rgb(248, 250, 252)' : 'rgb(17, 24, 39)',
          fontSize: '12px',
        }}
      >
        {isBarChart ? (
          // For bar chart, show status and value only
          <p style={{ margin: 0, color: payload[0]?.color }}>
            {`${label}: $${typeof payload[0]?.value === 'number' ? payload[0].value.toFixed(2) : payload[0]?.value || '0.00'}`}
          </p>
        ) : (
          // For line chart, show date and value only
          <>
            <p style={{ margin: 0, marginBottom: '4px', fontWeight: 500 }}>{label}</p>
            <p style={{ margin: 0, color: payload[0]?.color }}>
              {`$${typeof payload[0]?.value === 'number' ? payload[0].value.toFixed(2) : payload[0]?.value || '0.00'}`}
            </p>
          </>
        )}
      </div>
    )
  }
  return null
}

export default function RevenueCharts({ trainerId }: RevenueChartsProps) {
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([])
  const [statusData, setStatusData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  useEffect(() => {
    loadRevenueData()
  }, [trainerId])

  async function loadRevenueData() {
    try {
      // Get last 6 months of revenue
      const sixMonthsAgo = subMonths(new Date(), 5)
      const months = eachMonthOfInterval({
        start: startOfMonth(sixMonthsAgo),
        end: endOfMonth(new Date()),
      })

      // Load payments for last 6 months
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('trainer_id', trainerId)
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: true })

      // Group by month
      const monthlyData = months.map((month) => {
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)
        const monthPayments = payments?.filter((p) => {
          const paymentDate = new Date(p.created_at)
          return paymentDate >= monthStart && paymentDate <= monthEnd
        }) || []

        const total = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0)

        return {
          month: format(month, 'MMM yyyy'),
          revenue: total,
        }
      })

      setMonthlyRevenue(monthlyData)

      // Load invoice status data
      const { data: invoices } = await supabase
        .from('invoices')
        .select('status, amount')
        .eq('trainer_id', trainerId)

      const statusCounts: Record<string, number> = {}
      invoices?.forEach((inv) => {
        if (!statusCounts[inv.status]) {
          statusCounts[inv.status] = 0
        }
        statusCounts[inv.status] += Number(inv.amount)
      })

      const statusDataArray = Object.entries(statusCounts).map(([status, amount]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        amount,
      }))

      setStatusData(statusDataArray)
    } catch (error) {
      console.error('Error loading revenue data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
      {/* Monthly Revenue Line Chart */}
      <div className="bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200/50 dark:border-slate-700/30 p-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-1">Monthly Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700/30" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              className="dark:stroke-slate-300"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              className="dark:stroke-slate-300"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip isBarChart={false} />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Status Bar Chart */}
      <div className="bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200/50 dark:border-slate-700/30 p-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-1">Revenue by Invoice Status</h3>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={statusData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700/30" />
            <XAxis
              dataKey="status"
              stroke="#6b7280"
              className="dark:stroke-slate-300"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              className="dark:stroke-slate-300"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              content={<CustomTooltip isBarChart={true} />}
              cursor={{ fill: 'transparent' }}
            />
            <Legend />
            <Bar
              dataKey="amount"
              fill="#8b5cf6"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


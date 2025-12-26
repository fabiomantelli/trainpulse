'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'
import Link from 'next/link'
import { Database } from '@/types/database.types'

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  client_name?: string
}

const statusColors = {
  paid: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
  overdue: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
  sent: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300',
  draft: 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300',
  cancelled: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
}

const statusLabels = {
  paid: 'Paid',
  overdue: 'Overdue',
  sent: 'Sent',
  draft: 'Draft',
  cancelled: 'Cancelled',
}

export default function InvoiceCard({
  invoice,
  onClick,
}: {
  invoice: Invoice
  onClick?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group relative"
    >
      <Link
        href={`/invoices/${invoice.id}`}
        onClick={onClick}
        className="block bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 hover:shadow-xl dark:hover:shadow-slate-700/40 hover:shadow-blue-500/10 dark:hover:shadow-blue-500/10 hover:border-blue-200 dark:hover:border-slate-600/50 transition-all duration-300 p-5 border border-gray-200/50 dark:border-slate-700/30 group"
      >
        {/* Header: Amount (Primary) and Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">
              ${invoice.amount.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400 font-mono">
              #{invoice.id.slice(0, 8)}
            </div>
          </div>
          <span
            className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full ${statusColors[invoice.status as keyof typeof statusColors]}`}
          >
            {statusLabels[invoice.status as keyof typeof statusLabels]}
          </span>
        </div>

        {/* Client Name */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">Client</div>
          <div className="text-base font-semibold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {invoice.client_name || 'Unknown Client'}
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-2 mb-4">
          {invoice.due_date && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
              <svg
                className="w-4 h-4 text-gray-400 dark:text-slate-400"
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
              <span className="font-medium">Due:</span>
              <span>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
            <svg
              className="w-4 h-4 text-gray-400 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">Created:</span>
            <span>{format(new Date(invoice.created_at), 'MMM d, yyyy')}</span>
          </div>
        </div>

        {/* Action Link */}
        <div className="pt-3 border-t border-gray-200 dark:border-slate-700/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors">
              View Details →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}


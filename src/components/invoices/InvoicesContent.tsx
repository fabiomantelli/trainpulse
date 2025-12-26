'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import Link from 'next/link'
import { format } from 'date-fns'
import InvoiceCard from './InvoiceCard'

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  client_name?: string
}

export default function InvoicesContent({ trainerId }: { trainerId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    loadInvoices()
  }, [trainerId])

  async function loadInvoices() {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id (
            name
          )
        `)
        .eq('trainer_id', trainerId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading invoices:', error)
      } else {
        const invoicesWithClientName = (data || []).map((inv: any) => ({
          ...inv,
          client_name: inv.clients?.name || 'Unknown Client',
        }))
        setInvoices(invoicesWithClientName)
      }
      setLoading(false)
    } catch (error) {
      console.error('Unexpected error loading invoices:', error)
      setLoading(false)
    }
  }

  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'all') return invoices
    return invoices.filter((inv) => inv.status === statusFilter)
  }, [invoices, statusFilter])

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-slate-300">Loading invoices...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-1">Invoices</h1>
          <p className="text-sm text-gray-600 dark:text-slate-300">Manage client invoices and payments</p>
        </div>
        <Link
          href="/invoices/new"
          className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center space-x-2 whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Invoice</span>
        </Link>
      </div>

      {/* Filters */}
      {invoices.length > 0 && (
        <div className="mb-4 flex gap-2 flex-wrap">
          {['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-2 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">No invoices yet</h3>
          <p className="text-gray-500 dark:text-slate-300 mb-4">Create your first invoice to get started</p>
          <Link
            href="/invoices/new"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Invoice
          </Link>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-8 text-center">
          <p className="text-gray-500 dark:text-slate-300">No invoices found with the selected filter</p>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="md:hidden space-y-4">
            {filteredInvoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800 border-b-2 border-gray-200 dark:border-slate-700/30">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-8 py-4 text-right text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800/90 divide-y divide-gray-200 dark:divide-slate-700/30">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                          #{invoice.id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{invoice.client_name}</div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-base font-bold text-gray-900 dark:text-slate-100">
                          ${invoice.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span
                          className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                              : invoice.status === 'overdue'
                              ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                              : invoice.status === 'sent'
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                              : invoice.status === 'draft'
                              ? 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'
                              : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                        {invoice.due_date
                          ? format(new Date(invoice.due_date), 'MMM d, yyyy')
                          : '—'}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                        {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-semibold">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}


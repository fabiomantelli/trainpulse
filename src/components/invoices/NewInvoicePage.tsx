'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/database.types'
import BackButton from '@/components/layout/BackButton'
import toast from 'react-hot-toast'

type Client = Database['public']['Tables']['clients']['Row']

interface NewInvoicePageProps {
  trainerId: string
  clients: Client[]
}

export default function NewInvoicePage({ trainerId, clients }: NewInvoicePageProps) {
  const router = useRouter()
  const supabase = createClient()

  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [status, setStatus] = useState<'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'>('draft')
  const [dueDate, setDueDate] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!selectedClientId) {
      setError('Please select a client')
      setLoading(false)
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      setLoading(false)
      return
    }

    try {
      const invoiceData: any = {
        trainer_id: trainerId,
        client_id: selectedClientId,
        amount: parseFloat(amount),
        status,
        due_date: dueDate || null,
      }

      // If creating with paid status, set paid_at
      if (status === 'paid') {
        invoiceData.paid_at = new Date().toISOString()
      }

      // Insert invoice and get the created invoice data
      const { data: newInvoice, error: insertError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single()

      if (insertError) throw insertError

      // If status is paid, create payment record
      if (status === 'paid' && newInvoice) {
        const { data: newPayment, error: paymentError } = await supabase
          .from('payments')
          .insert({
            invoice_id: newInvoice.id,
            trainer_id: trainerId,
            client_id: selectedClientId,
            amount: Number(parseFloat(amount).toFixed(2)),
            stripe_payment_id: `manual-${newInvoice.id}-${Date.now()}`,
          })
          .select()
          .single()

        if (paymentError) {
          console.error('Error creating payment:', paymentError)
          toast.error(`Invoice created, but failed to create payment: ${paymentError.message}`)
        } else {
          console.log('Payment created successfully:', newPayment)
        }
      }

      toast.success('Invoice created successfully!')
      router.push('/invoices')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice')
      toast.error('Failed to create invoice')
      setLoading(false)
    }
  }

  return (
    <>
      <BackButton href="/invoices" />
      <div className="max-w-2xl">
        <div className="mb-5">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-1">Create New Invoice</h1>
          <p className="text-gray-600 dark:text-slate-400">Create an invoice for a client</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-5 lg:p-6">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm text-red-800 dark:text-red-300 font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Client *
              </label>
              {clients.length === 0 ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                    No clients found. Please create a client first.
                  </p>
                  <a
                    href="/clients/new"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Create a new client →
                  </a>
                </div>
              ) : (
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
                  )
                }
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-4 pt-6 border-t border-gray-200 dark:border-slate-700/30">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-slate-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}


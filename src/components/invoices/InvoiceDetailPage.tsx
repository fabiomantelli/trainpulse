'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Database } from '@/types/database.types'
import BackButton from '@/components/layout/BackButton'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

type Invoice = Database['public']['Tables']['invoices']['Row']
type Client = Database['public']['Tables']['clients']['Row']
type Payment = Database['public']['Tables']['payments']['Row']

interface InvoiceDetailPageProps {
  invoice: Invoice
  client: Client
  payments: Payment[]
}

export default function InvoiceDetailPage({
  invoice,
  client,
  payments,
}: InvoiceDetailPageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const remaining = invoice.amount - totalPaid

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    const { error } = await supabase.from('invoices').delete().eq('id', invoice.id)

    if (error) {
      toast.error('Failed to delete invoice')
      setDeleting(false)
    } else {
      toast.success('Invoice deleted successfully')
      router.push('/invoices')
      router.refresh()
    }
  }

  const handleStatusUpdate = async (newStatus: Invoice['status']) => {
    try {
      // If changing to paid, create payment first before updating invoice
      if (newStatus === 'paid' && invoice.status !== 'paid') {
        console.log('Creating payment for invoice:', invoice.id)
        
        // Check if payment already exists for this invoice
        const { data: paymentData, error: checkError } = await (supabase
          .from('payments') as any)
          .select('id, amount')
          .eq('invoice_id', invoice.id)
        const existingPayments = paymentData as Array<{ id: string; amount: number }> | null

        if (checkError) {
          console.error('Error checking existing payments:', checkError)
        } else {
          console.log('Existing payments:', existingPayments)
        }

        // Calculate total of existing payments
        const existingTotal = existingPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
        
        // Only create payment if none exists or if there's remaining amount
        const invoiceAmount = typeof invoice.amount === 'string' ? parseFloat(invoice.amount) : Number(invoice.amount)
        const remainingAmount = invoiceAmount - existingTotal
        
        console.log('Invoice amount:', invoiceAmount, 'Existing total:', existingTotal, 'Remaining:', remainingAmount)
        
        if (remainingAmount > 0) {
          const paymentData = {
            invoice_id: invoice.id,
            trainer_id: invoice.trainer_id,
            client_id: invoice.client_id,
            amount: Number(remainingAmount.toFixed(2)), // Ensure it's a number with 2 decimal places
            stripe_payment_id: `manual-${invoice.id}-${Date.now()}`,
          }
          
          console.log('Inserting payment:', paymentData)
          
          // Create payment record with manual ID
          const { data: newPayment, error: paymentError } = await (supabase
            .from('payments') as any)
            .insert(paymentData)
            .select()
            .single()

          if (paymentError) {
            console.error('Error creating payment:', paymentError)
            toast.error(`Failed to create payment: ${paymentError.message}`)
            return // Don't update invoice if payment creation fails
          }
          
          console.log('Payment created successfully:', newPayment)
          toast.success('Payment created successfully')
        } else if (remainingAmount <= 0) {
          console.log('No remaining amount to create payment for')
        }
      }

      // Update invoice status
      const updateData: any = { status: newStatus }
      
      // If changing to paid, set paid_at
      if (newStatus === 'paid' && invoice.status !== 'paid') {
        updateData.paid_at = new Date().toISOString()
      }

      const { error } = await (supabase
        .from('invoices') as any)
        .update(updateData)
        .eq('id', invoice.id)

      if (error) {
        console.error('Error updating invoice:', error)
        toast.error('Failed to update invoice status')
      } else {
        toast.success('Invoice status updated')
        router.refresh()
      }
    } catch (error: any) {
      console.error('Error updating invoice status:', error)
      toast.error(`Failed to update invoice status: ${error.message || 'Unknown error'}`)
    }
  }

  return (
    <>
      <BackButton href="/invoices" />
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-1">
              Invoice #{invoice.id.slice(0, 8)}
            </h1>
            <p className="text-gray-600 dark:text-slate-400">Client: {client.name}</p>
          </div>
          <div className="flex gap-2">
            <select
              value={invoice.status}
              onChange={(e) =>
                handleStatusUpdate(
                  e.target.value as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
                )
              }
              className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg font-medium bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Details */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Invoice Details</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Amount:</span>
                  <span className="font-semibold text-gray-900 dark:text-slate-100">${invoice.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : invoice.status === 'overdue'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        : invoice.status === 'sent'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                        : invoice.status === 'draft'
                        ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
                {invoice.due_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Due Date:</span>
                    <span className="text-gray-900 dark:text-slate-100">
                      {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {invoice.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Paid At:</span>
                    <span className="text-gray-900 dark:text-slate-100">
                      {format(new Date(invoice.paid_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Created:</span>
                  <span className="text-gray-900 dark:text-slate-100">
                    {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>

            {/* Payments */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Payments</h2>
              {payments.length === 0 ? (
                <p className="text-gray-500 dark:text-slate-400 text-sm">No payments recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-700/30 rounded-lg bg-gray-50 dark:bg-slate-700/30"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-100">
                          ${payment.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {format(new Date(payment.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        {payment.stripe_payment_id.startsWith('manual-')
                          ? 'Manual Payment'
                          : `Payment ID: ${payment.stripe_payment_id.slice(0, 8)}...`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Total Amount:</span>
                  <span className="font-semibold text-gray-900 dark:text-slate-100">${invoice.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Paid:</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">${totalPaid.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-slate-700/30 pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-slate-100">Remaining:</span>
                  <span className="font-bold text-gray-900 dark:text-slate-100">${remaining.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700/30 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Client</h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-900 dark:text-slate-100">{client.name}</p>
                {client.email && <p className="text-sm text-gray-600 dark:text-slate-400">{client.email}</p>}
                {client.phone && <p className="text-sm text-gray-600 dark:text-slate-400">{client.phone}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import InvoiceDetailPage from '@/components/invoices/InvoiceDetailPage'
import { Database } from '@/types/database.types'

type Invoice = Database['public']['Tables']['invoices']['Row']

export default async function InvoiceDetail({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Load invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', params.id)
    .eq('trainer_id', user.id)
    .single()

  if (invoiceError || !invoice) {
    notFound()
  }

  // Type assertion needed because Supabase type inference doesn't work perfectly
  const typedInvoice = invoice as Invoice

  // Load client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name, email, phone')
    .eq('id', typedInvoice.client_id)
    .single()

  if (clientError || !client) {
    notFound()
  }

  // Load payments for this invoice
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <InvoiceDetailPage
      invoice={typedInvoice}
      client={client}
      payments={payments || []}
    />
  )
}



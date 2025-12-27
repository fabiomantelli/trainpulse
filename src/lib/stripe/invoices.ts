import Stripe from 'stripe'
import { stripe } from './server'
import { Database } from '@/types/database.types'

type Client = Database['public']['Tables']['clients']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export interface CreateInvoiceParams {
  trainer: Profile
  client: Client
  amount: number
  description?: string
  dueDate?: Date
}

/**
 * Create or retrieve a Stripe customer for a client
 * @param client Client data
 * @param trainerAccountId Stripe Connect account ID of the trainer
 * @returns Stripe customer ID
 */
export async function getOrCreateStripeCustomer(
  client: Client,
  trainerAccountId: string
): Promise<string> {
  // If client already has a stripe_customer_id stored, use it
  // For now, we'll create a new customer each time
  // In production, you might want to store stripe_customer_id in the clients table

  const customer = await stripe.customers.create(
    {
      email: client.email || undefined,
      name: client.name,
      phone: client.phone || undefined,
      address: client.state || client.city || client.zip_code
        ? {
            line1: '', // You might want to add address_line1 to clients table
            city: client.city || undefined,
            state: client.state || undefined,
            postal_code: client.zip_code || undefined,
            country: 'US',
          }
        : undefined,
      metadata: {
        client_id: client.id,
        trainer_id: client.trainer_id,
      },
    },
    {
      stripeAccount: trainerAccountId,
    }
  )

  return customer.id
}

/**
 * Create an invoice in Stripe with automatic tax calculation
 * @param params Invoice creation parameters
 * @returns Stripe invoice object
 */
export async function createStripeInvoice(
  params: CreateInvoiceParams
): Promise<Stripe.Invoice> {
  const { trainer, client, amount, description, dueDate } = params

  if (!trainer.stripe_account_id) {
    throw new Error('Trainer does not have a connected Stripe account')
  }

  // Get or create Stripe customer for the client
  const customerId = await getOrCreateStripeCustomer(
    client,
    trainer.stripe_account_id
  )

  // Create invoice item
  const invoiceItem = await stripe.invoiceItems.create(
    {
      customer: customerId,
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      description: description || `Invoice for ${client.name}`,
    },
    {
      stripeAccount: trainer.stripe_account_id,
    }
  )

  // Create invoice with automatic tax
  const invoice = await stripe.invoices.create(
    {
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: dueDate
        ? Math.ceil(
            (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
        : 30,
      automatic_tax: {
        enabled: true,
      },
    },
    {
      stripeAccount: trainer.stripe_account_id,
    }
  )

  // Finalize the invoice (required before sending)
  const finalizedInvoice = await stripe.invoices.finalizeInvoice(
    invoice.id,
    {
      auto_advance: false, // Don't automatically attempt payment
    },
    {
      stripeAccount: trainer.stripe_account_id,
    }
  )

  return finalizedInvoice
}

/**
 * Send an invoice to the customer via email
 * @param invoiceId Stripe invoice ID
 * @param trainerAccountId Stripe Connect account ID
 */
export async function sendInvoice(
  invoiceId: string,
  trainerAccountId: string
): Promise<void> {
  await stripe.invoices.sendInvoice(
    invoiceId,
    {},
    {
      stripeAccount: trainerAccountId,
    }
  )
}

/**
 * Retrieve an invoice from Stripe
 * @param invoiceId Stripe invoice ID
 * @param trainerAccountId Stripe Connect account ID
 * @returns Invoice object
 */
export async function getInvoice(
  invoiceId: string,
  trainerAccountId: string
): Promise<Stripe.Invoice> {
  return await stripe.invoices.retrieve(invoiceId, {
    stripeAccount: trainerAccountId,
  })
}


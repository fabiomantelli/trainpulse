import Stripe from 'stripe'
import { stripe } from './server'

// Product and Price IDs (will be created on first use or manually in Stripe Dashboard)
// These should be stored in environment variables or created programmatically
const TRAINPULSE_PRODUCT_NAME = 'TrainPulse Monthly'
const TRAINPULSE_PRICE_AMOUNT = 2900 // $29.00 in cents (standard pricing)
const EARLY_ADOPTER_PRICE_AMOUNT = 1900 // $19.00 in cents (early adopter pricing)
const TRAINPULSE_PRICE_CURRENCY = 'usd'

/**
 * Get or create the TrainPulse product in Stripe
 * @returns Product ID
 */
export async function getOrCreateProduct(): Promise<string> {
  // Try to find existing product by name
  const products = await stripe.products.list({
    limit: 100,
  })

  const existingProduct = products.data.find(
    (p) => p.name === TRAINPULSE_PRODUCT_NAME && p.active
  )

  if (existingProduct) {
    return existingProduct.id
  }

  // Create new product if not found
  const product = await stripe.products.create({
    name: TRAINPULSE_PRODUCT_NAME,
    description: 'Monthly subscription to TrainPulse platform',
  })

  return product.id
}

/**
 * Get or create the monthly price for TrainPulse (standard pricing)
 * @param productId Product ID
 * @returns Price ID
 */
export async function getOrCreatePrice(productId: string): Promise<string> {
  // Try to find existing price
  const prices = await stripe.prices.list({
    product: productId,
    limit: 100,
  })

  const existingPrice = prices.data.find(
    (p) =>
      p.active &&
      p.unit_amount === TRAINPULSE_PRICE_AMOUNT &&
      p.currency === TRAINPULSE_PRICE_CURRENCY &&
      p.recurring?.interval === 'month' &&
      !p.nickname?.includes('Early Adopter')
  )

  if (existingPrice) {
    return existingPrice.id
  }

  // Create new price if not found
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: TRAINPULSE_PRICE_AMOUNT,
    currency: TRAINPULSE_PRICE_CURRENCY,
    recurring: {
      interval: 'month',
    },
    nickname: 'TrainPulse Monthly',
  })

  return price.id
}

/**
 * Get or create the early adopter monthly price for TrainPulse
 * @param productId Product ID
 * @returns Price ID
 */
export async function getOrCreateEarlyAdopterPrice(productId: string): Promise<string> {
  // Try to find existing early adopter price
  const prices = await stripe.prices.list({
    product: productId,
    limit: 100,
  })

  const existingPrice = prices.data.find(
    (p) =>
      p.active &&
      p.unit_amount === EARLY_ADOPTER_PRICE_AMOUNT &&
      p.currency === TRAINPULSE_PRICE_CURRENCY &&
      p.recurring?.interval === 'month' &&
      (p.nickname?.includes('Early Adopter') || p.nickname === 'Early Adopter')
  )

  if (existingPrice) {
    return existingPrice.id
  }

  // Create new early adopter price if not found
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: EARLY_ADOPTER_PRICE_AMOUNT,
    currency: TRAINPULSE_PRICE_CURRENCY,
    recurring: {
      interval: 'month',
    },
    nickname: 'TrainPulse Monthly - Early Adopter',
  })

  return price.id
}

/**
 * Get or create a Stripe customer for a trainer
 * Note: This function should be called from an API route that has access to the database
 * to check if a customer already exists. For now, it creates a new customer.
 * The API route should check the database first and pass the existing customer_id if available.
 * @param trainerId Trainer user ID
 * @param email Trainer email
 * @param name Trainer name
 * @param existingCustomerId Optional existing customer ID from database
 * @returns Customer ID
 */
export async function getOrCreateCustomer(
  trainerId: string,
  email: string,
  name?: string,
  existingCustomerId?: string | null
): Promise<string> {
  // If customer already exists, return it
  if (existingCustomerId) {
    try {
      // Verify customer exists in Stripe
      await stripe.customers.retrieve(existingCustomerId)
      return existingCustomerId
    } catch (error) {
      // Customer doesn't exist in Stripe, create a new one
      console.warn(`Customer ${existingCustomerId} not found in Stripe, creating new one`)
    }
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      trainer_id: trainerId,
    },
  })

  return customer.id
}

/**
 * Create a checkout session for subscription
 * @param customerId Stripe customer ID
 * @param trainerId Trainer user ID
 * @param returnUrl URL to return to after checkout
 * @param isEarlyAdopter Whether this is an early adopter subscription
 * @returns Checkout session URL
 */
export async function createCheckoutSession(
  customerId: string,
  trainerId: string,
  returnUrl: string,
  isEarlyAdopter: boolean = false
): Promise<string> {
  const productId = await getOrCreateProduct()
  const priceId = isEarlyAdopter
    ? await getOrCreateEarlyAdopterPrice(productId)
    : await getOrCreatePrice(productId)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: returnUrl,
    metadata: {
      trainer_id: trainerId,
      is_early_adopter: isEarlyAdopter.toString(),
    },
    subscription_data: {
      metadata: {
        trainer_id: trainerId,
        is_early_adopter: isEarlyAdopter.toString(),
      },
    },
  })

  return session.url || ''
}

/**
 * Create a customer portal session for managing subscription
 * @param customerId Stripe customer ID
 * @param returnUrl URL to return to after portal
 * @returns Portal session URL
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session.url
}

/**
 * Get subscription details from Stripe
 * @param subscriptionId Stripe subscription ID
 * @returns Subscription object
 */
export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId)
}

/**
 * Cancel a subscription (immediate or at period end)
 * @param subscriptionId Stripe subscription ID
 * @param cancelImmediately If true, cancel immediately; if false, cancel at period end
 * @returns Updated subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelImmediately: boolean = false
) {
  if (cancelImmediately) {
    return await stripe.subscriptions.cancel(subscriptionId)
  } else {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  }
}


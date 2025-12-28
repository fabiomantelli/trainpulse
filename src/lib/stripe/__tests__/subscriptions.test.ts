import {
  getOrCreateCustomer,
  createCheckoutSession,
  createCustomerPortalSession,
  getOrCreateProduct,
  getOrCreatePrice,
  getOrCreateEarlyAdopterPrice,
} from '../subscriptions'
import { stripe } from '../server'

jest.mock('../server', () => ({
  stripe: {
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    products: {
      list: jest.fn(),
      create: jest.fn(),
    },
    prices: {
      list: jest.fn(),
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn(),
      },
    },
  },
}))

describe('Stripe Subscriptions Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getOrCreateCustomer', () => {
    it('should return existing customer if customerId is provided and valid', async () => {
      const existingCustomerId = 'cus_existing123'
      const mockCustomer = { id: existingCustomerId, email: 'test@example.com' }

      ;(stripe.customers.retrieve as jest.Mock).mockResolvedValue(mockCustomer)

      const result = await getOrCreateCustomer(
        'user-id',
        'test@example.com',
        'Test User',
        existingCustomerId
      )

      expect(result).toBe(existingCustomerId)
      expect(stripe.customers.retrieve).toHaveBeenCalledWith(existingCustomerId)
      expect(stripe.customers.create).not.toHaveBeenCalled()
    })

    it('should create new customer if existing customerId is invalid', async () => {
      const invalidCustomerId = 'cus_invalid123'
      const newCustomerId = 'cus_new123'

      ;(stripe.customers.retrieve as jest.Mock).mockRejectedValue(
        new Error('Customer not found')
      )
      ;(stripe.customers.create as jest.Mock).mockResolvedValue({
        id: newCustomerId,
      })

      const result = await getOrCreateCustomer(
        'user-id',
        'test@example.com',
        'Test User',
        invalidCustomerId
      )

      expect(result).toBe(newCustomerId)
      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        metadata: { trainer_id: 'user-id' },
      })
    })

    it('should create new customer if customerId is not provided', async () => {
      const newCustomerId = 'cus_new123'

      ;(stripe.customers.create as jest.Mock).mockResolvedValue({
        id: newCustomerId,
      })

      const result = await getOrCreateCustomer(
        'user-id',
        'test@example.com',
        'Test User',
        null
      )

      expect(result).toBe(newCustomerId)
      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        metadata: { trainer_id: 'user-id' },
      })
    })

    it('should create customer without name if name is not provided', async () => {
      const newCustomerId = 'cus_new123'

      ;(stripe.customers.create as jest.Mock).mockResolvedValue({
        id: newCustomerId,
      })

      const result = await getOrCreateCustomer('user-id', 'test@example.com', undefined, null)

      expect(result).toBe(newCustomerId)
      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: undefined,
        metadata: { trainer_id: 'user-id' },
      })
    })
  })

  describe('getOrCreateProduct', () => {
    it('should return existing product if found', async () => {
      const existingProductId = 'prod_existing123'
      const mockProducts = {
        data: [
          { id: existingProductId, name: 'TrainPulse Monthly', active: true },
          { id: 'prod_other', name: 'Other Product', active: true },
        ],
      }

      ;(stripe.products.list as jest.Mock).mockResolvedValue(mockProducts)

      const result = await getOrCreateProduct()

      expect(result).toBe(existingProductId)
      expect(stripe.products.create).not.toHaveBeenCalled()
    })

    it('should create new product if not found', async () => {
      const newProductId = 'prod_new123'
      const mockProducts = { data: [] }

      ;(stripe.products.list as jest.Mock).mockResolvedValue(mockProducts)
      ;(stripe.products.create as jest.Mock).mockResolvedValue({
        id: newProductId,
      })

      const result = await getOrCreateProduct()

      expect(result).toBe(newProductId)
      expect(stripe.products.create).toHaveBeenCalledWith({
        name: 'TrainPulse Monthly',
        description: 'Monthly subscription to TrainPulse platform',
      })
    })
  })

  describe('getOrCreatePrice', () => {
    it('should return existing price if found', async () => {
      const productId = 'prod_123'
      const existingPriceId = 'price_existing123'
      const mockPrices = {
        data: [
          {
            id: existingPriceId,
            active: true,
            unit_amount: 2900,
            currency: 'usd',
            recurring: { interval: 'month' },
          },
        ],
      }

      ;(stripe.prices.list as jest.Mock).mockResolvedValue(mockPrices)

      const result = await getOrCreatePrice(productId)

      expect(result).toBe(existingPriceId)
      expect(stripe.prices.create).not.toHaveBeenCalled()
    })

    it('should create new price if not found', async () => {
      const productId = 'prod_123'
      const newPriceId = 'price_new123'
      const mockPrices = { data: [] }

      ;(stripe.prices.list as jest.Mock).mockResolvedValue(mockPrices)
      ;(stripe.prices.create as jest.Mock).mockResolvedValue({
        id: newPriceId,
      })

      const result = await getOrCreatePrice(productId)

      expect(result).toBe(newPriceId)
      expect(stripe.prices.create).toHaveBeenCalledWith({
        product: productId,
        unit_amount: 2900,
        currency: 'usd',
        recurring: { interval: 'month' },
        nickname: 'TrainPulse Monthly',
      })
    })
  })

  describe('getOrCreateEarlyAdopterPrice', () => {
    it('should return existing early adopter price if found', async () => {
      const productId = 'prod_123'
      const existingPriceId = 'price_early123'
      const mockPrices = {
        data: [
          {
            id: existingPriceId,
            active: true,
            unit_amount: 1900,
            currency: 'usd',
            recurring: { interval: 'month' },
            nickname: 'TrainPulse Monthly - Early Adopter',
          },
        ],
      }

      ;(stripe.prices.list as jest.Mock).mockResolvedValue(mockPrices)

      const result = await getOrCreateEarlyAdopterPrice(productId)

      expect(result).toBe(existingPriceId)
      expect(stripe.prices.create).not.toHaveBeenCalled()
    })

    it('should create new early adopter price if not found', async () => {
      const productId = 'prod_123'
      const newPriceId = 'price_early_new123'
      const mockPrices = { data: [] }

      ;(stripe.prices.list as jest.Mock).mockResolvedValue(mockPrices)
      ;(stripe.prices.create as jest.Mock).mockResolvedValue({
        id: newPriceId,
      })

      const result = await getOrCreateEarlyAdopterPrice(productId)

      expect(result).toBe(newPriceId)
      expect(stripe.prices.create).toHaveBeenCalledWith({
        product: productId,
        unit_amount: 1900,
        currency: 'usd',
        recurring: { interval: 'month' },
        nickname: 'TrainPulse Monthly - Early Adopter',
      })
    })
  })

  describe('createCheckoutSession', () => {
    it('should create checkout session with standard pricing', async () => {
      const customerId = 'cus_123'
      const trainerId = 'trainer-123'
      const returnUrl = 'http://localhost:3000/subscription'
      const productId = 'prod_123'
      const priceId = 'price_standard123'
      const sessionUrl = 'https://checkout.stripe.com/test'

      // Mock getOrCreateProduct (first call)
      ;(stripe.products.list as jest.Mock).mockResolvedValueOnce({
        data: [{ id: productId, name: 'TrainPulse Monthly', active: true }],
      })
      // Mock getOrCreatePrice (second call)
      ;(stripe.prices.list as jest.Mock).mockResolvedValueOnce({
        data: [
          {
            id: priceId,
            active: true,
            unit_amount: 2900,
            currency: 'usd',
            recurring: { interval: 'month' },
          },
        ],
      })
      ;(stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
        url: sessionUrl,
      })

      const result = await createCheckoutSession(customerId, trainerId, returnUrl, false)

      expect(result).toBe(sessionUrl)
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: customerId,
          mode: 'subscription',
          line_items: [{ price: priceId, quantity: 1 }],
          metadata: {
            trainer_id: trainerId,
            is_early_adopter: 'false',
          },
        })
      )
    })

    it('should create checkout session with early adopter pricing', async () => {
      const customerId = 'cus_123'
      const trainerId = 'trainer-123'
      const returnUrl = 'http://localhost:3000/subscription'
      const productId = 'prod_123'
      const priceId = 'price_early123'
      const sessionUrl = 'https://checkout.stripe.com/test'

      // Mock getOrCreateProduct (first call)
      ;(stripe.products.list as jest.Mock).mockResolvedValueOnce({
        data: [{ id: productId, name: 'TrainPulse Monthly', active: true }],
      })
      // Mock getOrCreateEarlyAdopterPrice (second call)
      ;(stripe.prices.list as jest.Mock).mockResolvedValueOnce({
        data: [
          {
            id: priceId,
            active: true,
            unit_amount: 1900,
            currency: 'usd',
            recurring: { interval: 'month' },
            nickname: 'TrainPulse Monthly - Early Adopter',
          },
        ],
      })
      ;(stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
        url: sessionUrl,
      })

      const result = await createCheckoutSession(customerId, trainerId, returnUrl, true)

      expect(result).toBe(sessionUrl)
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: customerId,
          metadata: {
            trainer_id: trainerId,
            is_early_adopter: 'true',
          },
        })
      )
    })
  })

  describe('createCustomerPortalSession', () => {
    it('should create customer portal session', async () => {
      const customerId = 'cus_123'
      const returnUrl = 'http://localhost:3000/subscription'
      const portalUrl = 'https://billing.stripe.com/test'

      ;(stripe.billingPortal.sessions.create as jest.Mock).mockResolvedValue({
        url: portalUrl,
      })

      const result = await createCustomerPortalSession(customerId, returnUrl)

      expect(result).toBe(portalUrl)
      expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: customerId,
        return_url: returnUrl,
      })
    })
  })
})


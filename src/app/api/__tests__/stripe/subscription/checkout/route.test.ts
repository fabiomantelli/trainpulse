import { POST } from '@/app/api/stripe/subscription/checkout/route'
import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe/subscriptions'

jest.mock('@/lib/stripe/subscriptions', () => ({
  createCheckoutSession: jest.fn().mockResolvedValue('https://checkout.stripe.com/test'),
  getOrCreateCustomer: jest.fn().mockResolvedValue('cus_test123'),
}))

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/stripe/server', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          url: 'https://checkout.stripe.com/test',
        }),
      },
    },
  },
}))

describe('POST /api/stripe/subscription/checkout', () => {
  const mockRequest = {
    json: jest.fn().mockResolvedValue({
      priceId: 'price_test123',
    }),
  } as unknown as NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    
    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-id',
              email: 'test@example.com',
            },
          },
          error: null,
        }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'user-id', stripe_customer_id: 'cus_123' },
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
    })
  })

  it('should return error if Stripe key is missing', async () => {
    delete process.env.STRIPE_SECRET_KEY
    const response = await POST(mockRequest)
    const data = await response.json()
    
    expect(response.status).toBe(500)
    expect(data.error).toContain('Stripe is not configured')
  })

  it('should return 401 if user is not authenticated', async () => {
    ;(createServerClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        }),
      },
    })

    const response = await POST(mockRequest)
    const data = await response.json()
    
    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })
})



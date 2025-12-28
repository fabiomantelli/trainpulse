import { POST } from '@/app/api/stripe/webhooks/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/stripe/server', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}))

describe('POST /api/stripe/webhooks', () => {
  const mockRequest = {
    headers: {
      get: jest.fn().mockReturnValue('test-signature'),
    },
    body: {
      getReader: jest.fn(),
    },
    text: jest.fn().mockResolvedValue('{}'),
  } as any

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  })

  it('should return error if webhook secret is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    const response = await POST(mockRequest)
    const data = await response.json()
    
    expect(response.status).toBe(500)
    expect(data.error).toContain('Webhook secret')
  })

  it('should return 400 for invalid signature', async () => {
    const { stripe } = require('@/lib/stripe/server')
    ;(stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const response = await POST(mockRequest)
    const data = await response.json()
    
    expect(response.status).toBe(400)
  })
})



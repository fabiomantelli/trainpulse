jest.mock('@/lib/supabase/server')
jest.mock('@/lib/stripe/subscriptions', () => ({
  createCustomerPortalSession: jest.fn().mockResolvedValue('https://billing.stripe.com/test'),
}))

import { POST } from '@/app/api/stripe/subscription/portal/route'
import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createCustomerPortalSession } from '@/lib/stripe/subscriptions'

describe('POST /api/stripe/subscription/portal', () => {
  const mockRequest = {
    nextUrl: {
      origin: 'http://localhost:3000',
    },
  } as unknown as NextRequest

  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createServerClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
  })

  it('should return 401 if user is not authenticated', async () => {
    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 404 if profile is not found', async () => {
    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'user-id' } },
      error: null,
    })

    mockSupabaseClient.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Profile not found'),
      }),
    }))

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('No active subscription found')
  })

  it('should return 404 if stripe_customer_id is not found', async () => {
    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'user-id' } },
      error: null,
    })

    mockSupabaseClient.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { stripe_customer_id: null },
        error: null,
      }),
    }))

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('No active subscription found')
  })

  it('should successfully create portal session', async () => {
    const userId = 'user-id'
    const customerId = 'cus_123'
    const portalUrl = 'https://billing.stripe.com/test'

    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })

    mockSupabaseClient.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { stripe_customer_id: customerId },
        error: null,
      }),
    }))

    ;(createCustomerPortalSession as jest.Mock).mockResolvedValue(portalUrl)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.url).toBe(portalUrl)
    expect(createCustomerPortalSession).toHaveBeenCalledWith(
      customerId,
      `${mockRequest.nextUrl.origin}/subscription`
    )
  })

  it('should handle error creating portal session', async () => {
    const userId = 'user-id'
    const customerId = 'cus_123'

    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })

    mockSupabaseClient.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { stripe_customer_id: customerId },
        error: null,
      }),
    }))

    ;(createCustomerPortalSession as jest.Mock).mockRejectedValue(
      new Error('Stripe portal error')
    )

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Stripe portal error')
  })
})


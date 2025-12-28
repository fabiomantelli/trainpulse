jest.mock('@/lib/supabase/server')
jest.mock('@/lib/stripe/server', () => ({
  stripe: {
    subscriptions: {
      retrieve: jest.fn(),
    },
  },
}))

import { POST } from '@/app/api/stripe/subscription/sync/route'
import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'

describe('POST /api/stripe/subscription/sync', () => {
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

    const mockFrom = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Profile not found'),
      }),
    }))

    mockSupabaseClient.from = mockFrom

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Profile not found')
  })

  it('should return 404 if subscription_id is not found', async () => {
    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'user-id' } },
      error: null,
    })

    const mockFrom = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { stripe_subscription_id: null, stripe_customer_id: 'cus_123' },
        error: null,
      }),
    }))

    mockSupabaseClient.from = mockFrom

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('No active subscription found')
  })

  it('should successfully sync subscription status', async () => {
    const userId = 'user-id'
    const subscriptionId = 'sub_123'
    const mockSubscription = {
      id: subscriptionId,
      status: 'active',
      cancel_at_period_end: false,
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
      cancel_at: null,
    }

    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })

    const mockUpdate = jest.fn().mockResolvedValue({ error: null })
    mockSupabaseClient.from = jest.fn(() => {
      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn((column) => {
          if (column === 'id') {
            return {
              single: jest.fn().mockResolvedValue({
                data: {
                  stripe_subscription_id: subscriptionId,
                  stripe_customer_id: 'cus_123',
                },
                error: null,
              }),
            }
          }
          return mockBuilder
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }
      return mockBuilder
    })
    ;(stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue(mockSubscription)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.subscription_status).toBe('active')
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith(subscriptionId)
  })

  it('should handle cancelled subscription (cancel_at_period_end)', async () => {
    const userId = 'user-id'
    const subscriptionId = 'sub_123'
    const currentPeriodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    const mockSubscription = {
      id: subscriptionId,
      status: 'active',
      cancel_at_period_end: true,
      current_period_end: currentPeriodEnd,
      cancel_at: null,
    }

    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })

    mockSupabaseClient.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn((column) => {
        if (column === 'id') {
          return {
            single: jest.fn().mockResolvedValue({
              data: {
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: 'cus_123',
              },
              error: null,
            }),
          }
        }
        return {
          update: jest.fn().mockResolvedValue({ error: null }),
        }
      }),
      update: jest.fn().mockReturnThis(),
    }))

    ;(stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue(mockSubscription)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.subscription_status).toBe('cancelled')
    expect(data.cancel_at).toBeTruthy()
  })

  it('should handle update error', async () => {
    const userId = 'user-id'
    const subscriptionId = 'sub_123'
    const mockSubscription = {
      id: subscriptionId,
      status: 'active',
      cancel_at_period_end: false,
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      cancel_at: null,
    }

    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })

    mockSupabaseClient.from = jest.fn(() => {
      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn((column) => {
          if (column === 'id') {
            return {
              single: jest.fn().mockResolvedValue({
                data: {
                  stripe_subscription_id: subscriptionId,
                  stripe_customer_id: 'cus_123',
                },
                error: null,
              }),
            }
          }
          return mockBuilder
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: new Error('Database error'),
          }),
        }),
      }
      return mockBuilder
    })

    ;(stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue(mockSubscription)

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to sync subscription')
  })

  it('should handle Stripe API error', async () => {
    const userId = 'user-id'
    const subscriptionId = 'sub_123'

    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    })

    mockSupabaseClient.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: 'cus_123',
        },
        error: null,
      }),
    }))

    ;(stripe.subscriptions.retrieve as jest.Mock).mockRejectedValue(
      new Error('Stripe API error')
    )

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Stripe API error')
  })
})


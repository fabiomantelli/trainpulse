jest.mock('@/lib/supabase/server')
jest.mock('@/lib/email/appointments', () => ({
  sendAppointmentConfirmation: jest.fn().mockResolvedValue({ success: true }),
  sendAppointmentUpdate: jest.fn().mockResolvedValue({ success: true }),
  sendAppointmentCancellation: jest.fn().mockResolvedValue({ success: true }),
}))

import { POST } from '@/app/api/appointments/send-confirmation/route'
import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  sendAppointmentConfirmation,
  sendAppointmentUpdate,
  sendAppointmentCancellation,
} from '@/lib/email/appointments'

describe('POST /api/appointments/send-confirmation', () => {
  const createMockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest
  }

  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  }

  const mockAppointment = {
    id: 'appt-123',
    trainer_id: 'trainer-123',
    client_id: 'client-123',
    scheduled_at: new Date().toISOString(),
    duration_minutes: 60,
    status: 'scheduled',
    notes: 'Test notes',
    clients: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    profiles: {
      full_name: 'Trainer Name',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createServerClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
  })

  it('should return 400 if appointmentId is missing', async () => {
    const request = createMockRequest({ emailType: 'confirmation' })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('appointmentId is required')
  })

  it('should return 400 if emailType is missing or invalid', async () => {
    // Test missing emailType
    const request1 = createMockRequest({ appointmentId: 'appt-123' })
    const response1 = await POST(request1)
    const data1 = await response1.json()
    expect(response1.status).toBe(400)
    expect(data1.error).toContain('emailType must be one of')

    // Test invalid emailType
    const request2 = createMockRequest({
      appointmentId: 'appt-123',
      emailType: 'invalid',
    })
    const response2 = await POST(request2)
    const data2 = await response2.json()
    expect(response2.status).toBe(400)
    expect(data2.error).toContain('emailType must be one of')
  })

  it('should return 401 if user is not authenticated', async () => {
    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    })

    const request = createMockRequest({
      appointmentId: 'appt-123',
      emailType: 'confirmation',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 404 if appointment is not found', async () => {
    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'trainer-123' } },
      error: null,
    })

    mockSupabaseClient.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Appointment not found'),
      }),
    }))

    const request = createMockRequest({
      appointmentId: 'appt-123',
      emailType: 'confirmation',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Appointment not found')
  })

  it('should return 400 if client email is missing', async () => {
    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'trainer-123' } },
      error: null,
    })

    mockSupabaseClient.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          ...mockAppointment,
          clients: { name: 'John Doe', email: null },
        },
        error: null,
      }),
    }))

    const request = createMockRequest({
      appointmentId: 'appt-123',
      emailType: 'confirmation',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Client email not found')
  })

  it('should successfully send confirmation email', async () => {
    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'trainer-123' } },
      error: null,
    })

    mockSupabaseClient.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockAppointment,
        error: null,
      }),
    }))

    const request = createMockRequest({
      appointmentId: 'appt-123',
      emailType: 'confirmation',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(sendAppointmentConfirmation).toHaveBeenCalled()
  })

  it('should successfully send update email', async () => {
    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'trainer-123' } },
      error: null,
    })

    mockSupabaseClient.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockAppointment,
        error: null,
      }),
    }))

    const request = createMockRequest({
      appointmentId: 'appt-123',
      emailType: 'update',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(sendAppointmentUpdate).toHaveBeenCalled()
  })

  it('should successfully send cancellation email', async () => {
    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'trainer-123' } },
      error: null,
    })

    mockSupabaseClient.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockAppointment,
        error: null,
      }),
    }))

    const request = createMockRequest({
      appointmentId: 'appt-123',
      emailType: 'cancellation',
      cancellationReason: 'Client requested',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(sendAppointmentCancellation).toHaveBeenCalled()
  })

  it('should return 500 if email sending fails', async () => {
    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'trainer-123' } },
      error: null,
    })

    mockSupabaseClient.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockAppointment,
        error: null,
      }),
    }))

    ;(sendAppointmentConfirmation as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Email service error',
    })

    const request = createMockRequest({
      appointmentId: 'appt-123',
      emailType: 'confirmation',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Email service error')
  })

  it('should return 404 if appointment belongs to different trainer', async () => {
    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'different-trainer' } },
      error: null,
    })

    mockSupabaseClient.from = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Appointment not found'),
      }),
    }))

    const request = createMockRequest({
      appointmentId: 'appt-123',
      emailType: 'confirmation',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Appointment not found')
  })
})


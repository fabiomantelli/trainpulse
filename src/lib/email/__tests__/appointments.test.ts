// Use manual mock for resend
jest.mock('resend')

// Mock email templates
jest.mock('../templates', () => ({
  getConfirmationEmailSubject: jest.fn(() => 'Test Subject'),
  getConfirmationEmailHtml: jest.fn(() => '<p>Test HTML</p>'),
  getConfirmationEmailText: jest.fn(() => 'Test Text'),
  getUpdateEmailSubject: jest.fn(() => 'Test Subject'),
  getUpdateEmailHtml: jest.fn(() => '<p>Test HTML</p>'),
  getUpdateEmailText: jest.fn(() => 'Test Text'),
  getCancellationEmailSubject: jest.fn(() => 'Test Subject'),
  getCancellationEmailHtml: jest.fn(() => '<p>Test HTML</p>'),
  getCancellationEmailText: jest.fn(() => 'Test Text'),
}))

import { Resend } from 'resend'

import {
  sendAppointmentConfirmation,
  sendAppointmentUpdate,
  sendAppointmentCancellation,
} from '../appointments'

const resend = new Resend()
const mockSendFn = resend.emails.send as jest.Mock

// Mock environment variables
process.env.RESEND_API_KEY = 're_test_key'
process.env.RESEND_FROM_EMAIL = 'Test <test@example.com>'

describe('Email Appointments Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sendAppointmentConfirmation', () => {
    const baseEmailData = {
      type: 'confirmation' as const,
      appointmentId: 'appt-123',
      clientName: 'John Doe',
      clientEmail: 'john@example.com',
      trainerName: 'Trainer Name',
      scheduledAt: new Date('2024-12-30T10:00:00Z'),
      durationMinutes: 60,
      notes: 'Test notes',
      status: 'scheduled' as const,
    }

    it('should return error if RESEND_API_KEY is not configured', async () => {
      delete process.env.RESEND_API_KEY

      const result = await sendAppointmentConfirmation(baseEmailData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email service not configured')
    })

    it('should return error if client email is missing', async () => {
      process.env.RESEND_API_KEY = 're_test_key'

      const result = await sendAppointmentConfirmation({
        ...baseEmailData,
        clientEmail: '',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Client email is required')
    })

    it('should successfully send confirmation email', async () => {
      process.env.RESEND_API_KEY = 're_test_key'
      mockSendFn.mockResolvedValue({
        data: { id: 'email-id-123' },
        error: null,
      })

      const result = await sendAppointmentConfirmation(baseEmailData)

      expect(result.success).toBe(true)
      expect(mockSendFn).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['john@example.com'],
          subject: expect.any(String),
          html: expect.any(String),
          text: expect.any(String),
        })
      )
    })

    it('should return error if Resend API returns error', async () => {
      process.env.RESEND_API_KEY = 're_test_key'
      mockSendFn.mockResolvedValue({
        data: null,
        error: { message: 'Resend API error' },
      })

      const result = await sendAppointmentConfirmation(baseEmailData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Resend API error')
    })

    it('should handle exception when sending email', async () => {
      process.env.RESEND_API_KEY = 're_test_key'
      mockSendFn.mockRejectedValue(new Error('Network error'))

      const result = await sendAppointmentConfirmation(baseEmailData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('sendAppointmentUpdate', () => {
    const baseEmailData = {
      type: 'update' as const,
      appointmentId: 'appt-123',
      clientName: 'John Doe',
      clientEmail: 'john@example.com',
      trainerName: 'Trainer Name',
      scheduledAt: new Date('2024-12-30T10:00:00Z'),
      durationMinutes: 60,
      notes: 'Updated notes',
      status: 'scheduled' as const,
    }

    it('should return error if RESEND_API_KEY is not configured', async () => {
      delete process.env.RESEND_API_KEY

      const result = await sendAppointmentUpdate(baseEmailData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email service not configured')
    })

    it('should return error if client email is missing', async () => {
      process.env.RESEND_API_KEY = 're_test_key'

      const result = await sendAppointmentUpdate({
        ...baseEmailData,
        clientEmail: '',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Client email is required')
    })

    it('should successfully send update email', async () => {
      process.env.RESEND_API_KEY = 're_test_key'
      mockSendFn.mockResolvedValue({
        data: { id: 'email-id-123' },
        error: null,
      })

      const result = await sendAppointmentUpdate(baseEmailData)

      expect(result.success).toBe(true)
      expect(mockSendFn).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['john@example.com'],
        })
      )
    })
  })

  describe('sendAppointmentCancellation', () => {
    const baseEmailData = {
      type: 'cancellation' as const,
      appointmentId: 'appt-123',
      clientName: 'John Doe',
      clientEmail: 'john@example.com',
      trainerName: 'Trainer Name',
      scheduledAt: new Date('2024-12-30T10:00:00Z'),
      durationMinutes: 60,
      notes: null,
      status: 'cancelled' as const,
      cancellationReason: 'Client requested cancellation',
    }

    it('should return error if RESEND_API_KEY is not configured', async () => {
      delete process.env.RESEND_API_KEY

      const result = await sendAppointmentCancellation(baseEmailData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email service not configured')
    })

    it('should return error if client email is missing', async () => {
      process.env.RESEND_API_KEY = 're_test_key'

      const result = await sendAppointmentCancellation({
        ...baseEmailData,
        clientEmail: '',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Client email is required')
    })

    it('should successfully send cancellation email', async () => {
      process.env.RESEND_API_KEY = 're_test_key'
      mockSendFn.mockResolvedValue({
        data: { id: 'email-id-123' },
        error: null,
      })

      const result = await sendAppointmentCancellation(baseEmailData)

      expect(result.success).toBe(true)
      expect(mockSendFn).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['john@example.com'],
        })
      )
    })

    it('should handle cancellation with null reason', async () => {
      process.env.RESEND_API_KEY = 're_test_key'
      mockSendFn.mockResolvedValue({
        data: { id: 'email-id-123' },
        error: null,
      })

      const result = await sendAppointmentCancellation({
        ...baseEmailData,
        cancellationReason: null,
      })

      expect(result.success).toBe(true)
    })
  })
})

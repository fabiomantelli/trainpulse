import { Resend } from 'resend'
import {
  AppointmentConfirmationEmailData,
  AppointmentUpdateEmailData,
  AppointmentCancellationEmailData,
} from '@/types/email'
import {
  getConfirmationEmailSubject,
  getConfirmationEmailHtml,
  getConfirmationEmailText,
  getUpdateEmailSubject,
  getUpdateEmailHtml,
  getUpdateEmailText,
  getCancellationEmailSubject,
  getCancellationEmailHtml,
  getCancellationEmailText,
} from './templates'

const resend = new Resend(process.env.RESEND_API_KEY)

// Get the from email address - use env variable or default
const getFromEmail = () => {
  return process.env.RESEND_FROM_EMAIL || 'TrainPulse <noreply@trainpulse.com>'
}

export async function sendAppointmentConfirmation(
  data: AppointmentConfirmationEmailData
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured')
    return { success: false, error: 'Email service not configured' }
  }

  if (!data.clientEmail) {
    console.error('Client email is missing')
    return { success: false, error: 'Client email is required' }
  }

  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: [data.clientEmail],
      subject: getConfirmationEmailSubject(data),
      html: getConfirmationEmailHtml(data),
      text: getConfirmationEmailText(data),
    })

    if (result.error) {
      console.error('Error sending confirmation email:', result.error)
      return { success: false, error: result.error.message || 'Failed to send email' }
    }

    console.log('Confirmation email sent successfully:', result.data?.id)
    return { success: true }
  } catch (error: any) {
    console.error('Exception sending confirmation email:', error)
    return { success: false, error: error.message || 'Failed to send email' }
  }
}

export async function sendAppointmentUpdate(
  data: AppointmentUpdateEmailData
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured')
    return { success: false, error: 'Email service not configured' }
  }

  if (!data.clientEmail) {
    console.error('Client email is missing')
    return { success: false, error: 'Client email is required' }
  }

  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: [data.clientEmail],
      subject: getUpdateEmailSubject(data),
      html: getUpdateEmailHtml(data),
      text: getUpdateEmailText(data),
    })

    if (result.error) {
      console.error('Error sending update email:', result.error)
      return { success: false, error: result.error.message || 'Failed to send email' }
    }

    console.log('Update email sent successfully:', result.data?.id)
    return { success: true }
  } catch (error: any) {
    console.error('Exception sending update email:', error)
    return { success: false, error: error.message || 'Failed to send email' }
  }
}

export async function sendAppointmentCancellation(
  data: AppointmentCancellationEmailData
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured')
    return { success: false, error: 'Email service not configured' }
  }

  if (!data.clientEmail) {
    console.error('Client email is missing')
    return { success: false, error: 'Client email is required' }
  }

  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: [data.clientEmail],
      subject: getCancellationEmailSubject(data),
      html: getCancellationEmailHtml(data),
      text: getCancellationEmailText(data),
    })

    if (result.error) {
      console.error('Error sending cancellation email:', result.error)
      return { success: false, error: result.error.message || 'Failed to send email' }
    }

    console.log('Cancellation email sent successfully:', result.data?.id)
    return { success: true }
  } catch (error: any) {
    console.error('Exception sending cancellation email:', error)
    return { success: false, error: error.message || 'Failed to send email' }
  }
}





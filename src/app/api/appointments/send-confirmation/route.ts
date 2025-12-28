import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  sendAppointmentConfirmation,
  sendAppointmentUpdate,
  sendAppointmentCancellation,
} from '@/lib/email/appointments'
import {
  AppointmentConfirmationEmailData,
  AppointmentUpdateEmailData,
  AppointmentCancellationEmailData,
} from '@/types/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointmentId, emailType } = body

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointmentId is required' },
        { status: 400 }
      )
    }

    if (!emailType || !['confirmation', 'update', 'cancellation'].includes(emailType)) {
      return NextResponse.json(
        { error: 'emailType must be one of: confirmation, update, cancellation' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch appointment with client and trainer data
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        clients:client_id (
          name,
          email
        ),
        profiles:trainer_id (
          full_name
        )
      `)
      .eq('id', appointmentId)
      .eq('trainer_id', user.id)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Type assertion for appointment with relations
    const apt = appointment as any
    const client = apt.clients
    const trainer = apt.profiles

    if (!client || !client.email) {
      return NextResponse.json(
        { error: 'Client email not found' },
        { status: 400 }
      )
    }

    const scheduledAt = new Date(apt.scheduled_at)
    const baseEmailData = {
      appointmentId: apt.id,
      clientName: client.name,
      clientEmail: client.email,
      trainerName: trainer?.full_name || 'Your Trainer',
      scheduledAt,
      durationMinutes: apt.duration_minutes,
      notes: apt.notes,
      status: apt.status,
    }

    let result

    if (emailType === 'confirmation') {
      const emailData: AppointmentConfirmationEmailData = {
        ...baseEmailData,
        type: 'confirmation',
      }
      result = await sendAppointmentConfirmation(emailData)
    } else if (emailType === 'update') {
      // For updates, we might want to pass previous values
      // For now, we'll just send the current values
      const emailData: AppointmentUpdateEmailData = {
        ...baseEmailData,
        type: 'update',
      }
      result = await sendAppointmentUpdate(emailData)
    } else if (emailType === 'cancellation') {
      const emailData: AppointmentCancellationEmailData = {
        ...baseEmailData,
        type: 'cancellation',
        cancellationReason: body.cancellationReason || null,
      }
      result = await sendAppointmentCancellation(emailData)
    } else {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Email sent successfully' })
  } catch (error: any) {
    console.error('Error in send-confirmation route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}



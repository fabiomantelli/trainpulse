import { format } from 'date-fns'
import {
  AppointmentConfirmationEmailData,
  AppointmentUpdateEmailData,
  AppointmentCancellationEmailData,
} from '@/types/email'

function formatDateTime(date: Date): string {
  return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a")
}

function formatDate(date: Date): string {
  return format(date, 'MMMM d, yyyy')
}

function formatTime(date: Date): string {
  return format(date, 'h:mm a')
}

export function getConfirmationEmailSubject(data: AppointmentConfirmationEmailData): string {
  return `Appointment Confirmed - ${formatDate(data.scheduledAt)}`
}

export function getConfirmationEmailHtml(data: AppointmentConfirmationEmailData): string {
  const endTime = new Date(data.scheduledAt.getTime() + data.durationMinutes * 60 * 1000)
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Appointment Confirmed</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${data.clientName},</p>
    
    <p style="font-size: 16px;">Your appointment with <strong>${data.trainerName}</strong> has been confirmed.</p>
    
    <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;"><strong>Date & Time:</strong></p>
      <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">${formatDateTime(data.scheduledAt)}</p>
      <p style="margin: 0; font-size: 14px; color: #6b7280;">Duration: ${data.durationMinutes} minutes (until ${formatTime(endTime)})</p>
    </div>
    
    ${data.notes ? `
    <div style="margin: 20px 0;">
      <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;"><strong>Notes:</strong></p>
      <p style="font-size: 16px; background: #f9fafb; padding: 15px; border-radius: 4px; margin: 0;">${data.notes}</p>
    </div>
    ` : ''}
    
    <p style="font-size: 16px; margin-top: 30px;">We look forward to seeing you!</p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      If you need to reschedule or cancel, please contact ${data.trainerName} as soon as possible.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
    <p style="margin: 0;">This is an automated confirmation email from TrainPulse.</p>
  </div>
</body>
</html>
  `.trim()
}

export function getConfirmationEmailText(data: AppointmentConfirmationEmailData): string {
  const endTime = new Date(data.scheduledAt.getTime() + data.durationMinutes * 60 * 1000)
  
  return `
Hi ${data.clientName},

Your appointment with ${data.trainerName} has been confirmed.

Date & Time: ${formatDateTime(data.scheduledAt)}
Duration: ${data.durationMinutes} minutes (until ${formatTime(endTime)})

${data.notes ? `Notes: ${data.notes}\n` : ''}

We look forward to seeing you!

If you need to reschedule or cancel, please contact ${data.trainerName} as soon as possible.

---
This is an automated confirmation email from TrainPulse.
  `.trim()
}

export function getUpdateEmailSubject(data: AppointmentUpdateEmailData): string {
  return `Appointment Updated - ${formatDate(data.scheduledAt)}`
}

export function getUpdateEmailHtml(data: AppointmentUpdateEmailData): string {
  const endTime = new Date(data.scheduledAt.getTime() + data.durationMinutes * 60 * 1000)
  const hasTimeChange = data.previousScheduledAt && 
    data.previousScheduledAt.getTime() !== data.scheduledAt.getTime()
  const hasDurationChange = data.previousDurationMinutes && 
    data.previousDurationMinutes !== data.durationMinutes
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Updated</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Appointment Updated</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${data.clientName},</p>
    
    <p style="font-size: 16px;">Your appointment with <strong>${data.trainerName}</strong> has been updated.</p>
    
    ${hasTimeChange || hasDurationChange ? `
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>⚠️ Changes made:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px; color: #92400e;">
        ${hasTimeChange ? `<li>Time changed from ${formatDateTime(data.previousScheduledAt!)} to ${formatDateTime(data.scheduledAt)}</li>` : ''}
        ${hasDurationChange ? `<li>Duration changed from ${data.previousDurationMinutes} minutes to ${data.durationMinutes} minutes</li>` : ''}
      </ul>
    </div>
    ` : ''}
    
    <div style="background: #f9fafb; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;"><strong>Updated Date & Time:</strong></p>
      <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">${formatDateTime(data.scheduledAt)}</p>
      <p style="margin: 0; font-size: 14px; color: #6b7280;">Duration: ${data.durationMinutes} minutes (until ${formatTime(endTime)})</p>
    </div>
    
    ${data.notes ? `
    <div style="margin: 20px 0;">
      <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;"><strong>Notes:</strong></p>
      <p style="font-size: 16px; background: #f9fafb; padding: 15px; border-radius: 4px; margin: 0;">${data.notes}</p>
    </div>
    ` : ''}
    
    <p style="font-size: 16px; margin-top: 30px;">Please make note of the updated time.</p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      If you have any questions, please contact ${data.trainerName}.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
    <p style="margin: 0;">This is an automated email from TrainPulse.</p>
  </div>
</body>
</html>
  `.trim()
}

export function getUpdateEmailText(data: AppointmentUpdateEmailData): string {
  const endTime = new Date(data.scheduledAt.getTime() + data.durationMinutes * 60 * 1000)
  const hasTimeChange = data.previousScheduledAt && 
    data.previousScheduledAt.getTime() !== data.scheduledAt.getTime()
  const hasDurationChange = data.previousDurationMinutes && 
    data.previousDurationMinutes !== data.durationMinutes
  
  return `
Hi ${data.clientName},

Your appointment with ${data.trainerName} has been updated.

${hasTimeChange || hasDurationChange ? `
Changes made:
${hasTimeChange ? `- Time changed from ${formatDateTime(data.previousScheduledAt!)} to ${formatDateTime(data.scheduledAt)}\n` : ''}
${hasDurationChange ? `- Duration changed from ${data.previousDurationMinutes} minutes to ${data.durationMinutes} minutes\n` : ''}
` : ''}
Updated Date & Time: ${formatDateTime(data.scheduledAt)}
Duration: ${data.durationMinutes} minutes (until ${formatTime(endTime)})

${data.notes ? `Notes: ${data.notes}\n` : ''}

Please make note of the updated time.

If you have any questions, please contact ${data.trainerName}.

---
This is an automated email from TrainPulse.
  `.trim()
}

export function getCancellationEmailSubject(data: AppointmentCancellationEmailData): string {
  return `Appointment Cancelled - ${formatDate(data.scheduledAt)}`
}

export function getCancellationEmailHtml(data: AppointmentCancellationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Cancelled</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Appointment Cancelled</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${data.clientName},</p>
    
    <p style="font-size: 16px;">Your appointment with <strong>${data.trainerName}</strong> has been cancelled.</p>
    
    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;"><strong>Cancelled Appointment:</strong></p>
      <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">${formatDateTime(data.scheduledAt)}</p>
      <p style="margin: 0; font-size: 14px; color: #6b7280;">Duration: ${data.durationMinutes} minutes</p>
    </div>
    
    ${data.cancellationReason ? `
    <div style="margin: 20px 0;">
      <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;"><strong>Reason:</strong></p>
      <p style="font-size: 16px; background: #f9fafb; padding: 15px; border-radius: 4px; margin: 0;">${data.cancellationReason}</p>
    </div>
    ` : ''}
    
    <p style="font-size: 16px; margin-top: 30px;">We're sorry for any inconvenience this may cause.</p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      If you'd like to reschedule, please contact ${data.trainerName} to book a new appointment.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
    <p style="margin: 0;">This is an automated email from TrainPulse.</p>
  </div>
</body>
</html>
  `.trim()
}

export function getCancellationEmailText(data: AppointmentCancellationEmailData): string {
  return `
Hi ${data.clientName},

Your appointment with ${data.trainerName} has been cancelled.

Cancelled Appointment: ${formatDateTime(data.scheduledAt)}
Duration: ${data.durationMinutes} minutes

${data.cancellationReason ? `Reason: ${data.cancellationReason}\n` : ''}

We're sorry for any inconvenience this may cause.

If you'd like to reschedule, please contact ${data.trainerName} to book a new appointment.

---
This is an automated email from TrainPulse.
  `.trim()
}





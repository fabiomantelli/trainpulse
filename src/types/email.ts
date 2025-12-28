export interface AppointmentEmailData {
  appointmentId: string
  clientName: string
  clientEmail: string
  trainerName: string
  scheduledAt: Date
  durationMinutes: number
  notes?: string | null
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
}

export interface AppointmentConfirmationEmailData extends AppointmentEmailData {
  type: 'confirmation'
}

export interface AppointmentUpdateEmailData extends AppointmentEmailData {
  type: 'update'
  previousScheduledAt?: Date
  previousDurationMinutes?: number
}

export interface AppointmentCancellationEmailData extends AppointmentEmailData {
  type: 'cancellation'
  cancellationReason?: string | null
}

export type AppointmentEmailType = 
  | AppointmentConfirmationEmailData 
  | AppointmentUpdateEmailData 
  | AppointmentCancellationEmailData





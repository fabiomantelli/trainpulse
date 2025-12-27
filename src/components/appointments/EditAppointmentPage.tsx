'use client'

import { useRouter } from 'next/navigation'
import AppointmentForm from './AppointmentForm'
import { Database } from '@/types/database.types'

type Appointment = Database['public']['Tables']['appointments']['Row']
type Client = Database['public']['Tables']['clients']['Row']

export default function EditAppointmentPage({
  trainerId,
  appointment,
  clients,
}: {
  trainerId: string
  appointment: Appointment
  clients: Client[]
}) {
  const router = useRouter()

  const handleSuccess = () => {
    router.push(`/appointments/${appointment.id}`)
    router.refresh()
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Edit Appointment
            </h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
              Update appointment details
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700 p-6 md:p-8">
            <AppointmentForm
              trainerId={trainerId}
              appointment={appointment}
              clients={clients}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </>
  )
}


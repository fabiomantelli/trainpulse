'use client'

import { useRouter } from 'next/navigation'
import AppointmentForm from './AppointmentForm'
import { Database } from '@/types/database.types'
import { Toaster } from 'react-hot-toast'

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
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Edit Appointment
            </h1>
            <p className="text-sm lg:text-base text-gray-600">
              Update appointment details
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
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


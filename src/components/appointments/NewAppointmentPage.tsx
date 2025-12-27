'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppointmentForm from './AppointmentForm'
import { Database } from '@/types/database.types'
import BackButton from '@/components/layout/BackButton'

type Client = Database['public']['Tables']['clients']['Row']

export default function NewAppointmentPage({
  trainerId,
  clients,
}: {
  trainerId: string
  clients: Client[]
}) {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/appointments')
    router.refresh()
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <>
      <BackButton href="/appointments" />
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Schedule New Appointment
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            Create a new appointment for one of your clients
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 md:p-8">
          <AppointmentForm
            trainerId={trainerId}
            clients={clients}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </>
  )
}


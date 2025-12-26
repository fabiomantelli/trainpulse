'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppointmentForm from './AppointmentForm'
import { Database } from '@/types/database.types'
import { Toaster } from 'react-hot-toast'
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

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NewAppointmentPage.tsx:17',message:'NewAppointmentPage render',data:{clientsCount:clients.length,trainerId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  }, [clients.length, trainerId]);
  // #endregion

  const handleSuccess = () => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/2558d52a-fba9-4902-9fcf-1ea396cdccc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NewAppointmentPage.tsx:25',message:'handleSuccess called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    router.push('/appointments')
    router.refresh()
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <>
      <Toaster position="top-right" />
      <BackButton href="/appointments" />
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Schedule New Appointment
          </h1>
          <p className="text-sm lg:text-base text-gray-600">
            Create a new appointment for one of your clients
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
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


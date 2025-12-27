'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, isToday, isSameWeek, isSameMonth, startOfWeek, startOfMonth } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Database } from '@/types/database.types'
import CalendarView from './CalendarView'
import AppointmentCard from './AppointmentCard'
import AppointmentModal from './AppointmentModal'
import AppointmentForm from './AppointmentForm'
import toast from 'react-hot-toast'

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  client_name?: string
  client_photo_url?: string | null
}

type Client = Database['public']['Tables']['clients']['Row']

type ViewMode = 'calendar' | 'list'
type FilterType = 'all' | 'today' | 'week' | 'month' | 'scheduled' | 'completed' | 'cancelled'

export default function AppointmentsContent({
  trainerId,
}: {
  trainerId: string
}) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [trainerId])

  async function loadData() {
    setLoading(true)
    try {
      // Load appointments with client info
      const { data: appointmentsData, error: aptError } = await supabase
        .from('appointments')
        .select(
          `
          *,
          clients (
            name,
            photo_url
          )
        `
        )
        .eq('trainer_id', trainerId)
        .order('scheduled_at', { ascending: true })

      if (aptError) throw aptError

      // Transform data
      const transformedAppointments = (appointmentsData || []).map((apt: any) => ({
        ...apt,
        client_name: apt.clients?.name,
        client_photo_url: apt.clients?.photo_url,
      }))

      setAppointments(transformedAppointments)

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('trainer_id', trainerId)
        .order('name', { ascending: true })

      if (clientsError) throw clientsError
      setClients(clientsData || [])
    } catch (error: any) {
      toast.error('Failed to load appointments')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAppointments = useMemo(() => {
    let filtered = appointments

    // Apply date filters
    if (filter === 'today') {
      filtered = filtered.filter((apt) =>
        isToday(new Date(apt.scheduled_at))
      )
    } else if (filter === 'week') {
      const weekStart = startOfWeek(new Date())
      filtered = filtered.filter((apt) =>
        isSameWeek(new Date(apt.scheduled_at), weekStart)
      )
    } else if (filter === 'month') {
      const monthStart = startOfMonth(new Date())
      filtered = filtered.filter((apt) =>
        isSameMonth(new Date(apt.scheduled_at), monthStart)
      )
    } else if (filter === 'scheduled') {
      filtered = filtered.filter((apt) => apt.status === 'scheduled')
    } else if (filter === 'completed') {
      filtered = filtered.filter((apt) => apt.status === 'completed')
    } else if (filter === 'cancelled') {
      filtered = filtered.filter((apt) => apt.status === 'cancelled')
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter((apt) =>
        apt.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [appointments, filter, searchQuery])

  const handleDateClick = (date: Date) => {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/94342fbf-de17-47b0-b324-c297d1d87e29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppointmentsContent.tsx:128',message:'handleDateClick - date clicked from calendar',data:{dateISO:date.toISOString(),dateFormatted:format(date,'yyyy-MM-dd'),dateLocal:date.toString(),timezoneOffset:date.getTimezoneOffset()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    setSelectedDate(date)
    setShowCreateModal(true)
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    // Navigate to detail page using Next.js router to preserve theme state
    router.push(`/appointments/${appointment.id}`)
  }

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    setSelectedDate(null)
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent mb-2">
              Appointments
            </h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-slate-300">
              Manage your schedule and appointments
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="group relative px-6 py-3.5 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 whitespace-nowrap overflow-hidden"
          >
            <span className="relative z-10 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Schedule Appointment</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1.5 shadow-sm border-2 border-gray-200/50 dark:border-slate-700/30">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
              }`}
            >
              List
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'today', 'week', 'month', 'scheduled', 'completed'] as FilterType[]).map(
              (filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    filter === filterOption
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200/50 dark:border-slate-700/30 hover:border-gray-300 dark:hover:border-slate-600/50'
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              )
            )}
          </div>

          {/* Search */}
          {viewMode === 'list' && (
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by client name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800"
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      {viewMode === 'calendar' ? (
        <div>
          <CalendarView
            appointments={filteredAppointments}
            onDateClick={handleDateClick}
            onAppointmentClick={handleAppointmentClick}
          />
        </div>
      ) : (
        <div>
          {filteredAppointments.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/90 rounded-xl shadow-lg dark:shadow-slate-900/50 border border-gray-200/50 dark:border-slate-700/30 p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-3 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-gray-400 dark:text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                No appointments found
              </h3>
              <p className="text-gray-600 dark:text-slate-300 mb-4">
                {searchQuery || filter !== 'all'
                  ? 'Try adjusting your filters or search'
                  : 'Get started by scheduling your first appointment'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="group relative px-6 py-3.5 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">Schedule Appointment</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {filteredAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onClick={() => handleAppointmentClick(appointment)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <AppointmentModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedDate(null)
        }}
        title="Schedule New Appointment"
      >
        <AppointmentForm
          trainerId={trainerId}
          clients={clients}
          onSuccess={handleCreateSuccess}
          onCancel={() => {
            setShowCreateModal(false)
            setSelectedDate(null)
          }}
          initialDate={selectedDate}
        />
      </AppointmentModal>
    </>
  )
}

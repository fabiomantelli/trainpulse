'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'
import Link from 'next/link'
import { Database } from '@/types/database.types'

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  client_name?: string
  client_photo_url?: string | null
}

const statusColors = {
  scheduled: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
  completed: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
  cancelled: 'bg-gray-400 text-white',
  no_show: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
}

const statusLabels = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

export default function AppointmentCard({
  appointment,
  onClick,
}: {
  appointment: Appointment
  onClick?: () => void
}) {
  const scheduledDate = new Date(appointment.scheduled_at)
  const endTime = new Date(
    scheduledDate.getTime() + appointment.duration_minutes * 60000
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative"
    >
      <Link
        href={`/appointments/${appointment.id}`}
        onClick={onClick}
        className="block bg-white dark:bg-slate-800/90 rounded-xl shadow-sm dark:shadow-slate-900/50 hover:shadow-xl dark:hover:shadow-slate-700/40 hover:shadow-blue-500/10 dark:hover:shadow-blue-500/10 hover:border-blue-200 dark:hover:border-slate-600/50 transition-all duration-300 p-5 border border-gray-200/50 dark:border-slate-700/30 group"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {appointment.client_photo_url ? (
              <img
                src={appointment.client_photo_url}
                alt={appointment.client_name || 'Client'}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-slate-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-gray-100 dark:ring-slate-700 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-white font-semibold text-lg">
                  {appointment.client_name?.charAt(0).toUpperCase() || 'C'}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {appointment.client_name || 'Client'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {format(scheduledDate, 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${statusColors[appointment.status]}`}
          >
            {statusLabels[appointment.status]}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
            <svg
              className="w-4 h-4 text-gray-400 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              {format(scheduledDate, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </span>
            <span className="text-gray-300 dark:text-slate-600">•</span>
            <span>{appointment.duration_minutes} min</span>
          </div>

          {appointment.notes && (
            <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2">
              {appointment.notes}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}


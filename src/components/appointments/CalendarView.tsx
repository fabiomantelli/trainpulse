'use client'

import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addDays, startOfDay, addHours, isBefore } from 'date-fns'
import { motion } from 'framer-motion'
import { Database } from '@/types/database.types'
import AppointmentCard from './AppointmentCard'

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  client_name?: string
  client_photo_url?: string | null
}

type ViewMode = 'month' | 'week' | 'day'

interface CalendarViewProps {
  appointments: Appointment[]
  onDateClick: (date: Date) => void
  onAppointmentClick: (appointment: Appointment) => void
}

export default function CalendarView({
  appointments,
  onDateClick,
  onAppointmentClick,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekStart = startOfWeek(currentDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const dayHours = Array.from({ length: 24 }, (_, i) => addHours(startOfDay(currentDate), i))

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    appointments.forEach((apt) => {
      const dateKey = format(new Date(apt.scheduled_at), 'yyyy-MM-dd')
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)!.push(apt)
    })
    return map
  }, [appointments])

  const getAppointmentsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return appointmentsByDate.get(dateKey) || []
  }

  const isPastDate = (date: Date) => {
    const today = startOfDay(new Date())
    const dateToCheck = startOfDay(date)
    return isBefore(dateToCheck, today)
  }

  const isPastDateTime = (date: Date) => {
    const now = new Date()
    return date < now
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) =>
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    )
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => addDays(prev, direction === 'prev' ? -7 : 7))
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => addDays(prev, direction === 'prev' ? -1 : 1))
  }

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-xl shadow-lg dark:shadow-slate-900/50 border border-gray-200/50 dark:border-slate-700/30 overflow-hidden">
      {/* Header - Mobile Optimized */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
            {viewMode === 'week' && (
              <span className="block sm:inline">
                {format(weekStart, 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
              </span>
            )}
            {viewMode === 'day' && (
              <span className="block sm:inline">{format(currentDate, 'EEEE, MMMM d, yyyy')}</span>
            )}
          </h2>
          {/* View Mode Toggle - Mobile optimized */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors whitespace-nowrap min-w-[70px] sm:min-w-0 ${
                viewMode === 'month'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors whitespace-nowrap min-w-[70px] sm:min-w-0 ${
                viewMode === 'week'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors whitespace-nowrap min-w-[70px] sm:min-w-0 ${
                viewMode === 'day'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Day
            </button>
          </div>
        </div>

        {/* Navigation - Mobile optimized with larger touch targets */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              if (viewMode === 'month') navigateMonth('prev')
              if (viewMode === 'week') navigateWeek('prev')
              if (viewMode === 'day') navigateDay('prev')
            }}
            className="p-2.5 sm:p-2 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-lg text-white transition-colors touch-manipulation"
            aria-label="Previous"
          >
            <svg className="w-5 h-5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="flex-1 sm:flex-initial px-4 sm:px-4 py-2.5 sm:py-2 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-lg text-white font-medium text-sm sm:text-base transition-colors touch-manipulation"
          >
            Today
          </button>
          <button
            onClick={() => {
              if (viewMode === 'month') navigateMonth('next')
              if (viewMode === 'week') navigateWeek('next')
              if (viewMode === 'day') navigateDay('next')
            }}
            className="p-2.5 sm:p-2 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-lg text-white transition-colors touch-manipulation"
            aria-label="Next"
          >
            <svg className="w-5 h-5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-3 sm:p-6">
        {viewMode === 'month' && (
          <>
            {/* Mobile: List view for better UX */}
            <div className="block sm:hidden space-y-3">
              {monthDays.map((day) => {
                const dayAppointments = getAppointmentsForDate(day)
                const isCurrentDay = isToday(day)
                const isPast = isPastDate(day)
                
                if (dayAppointments.length === 0 && !isCurrentDay) return null

                return (
                  <motion.div
                    key={day.toISOString()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      isPast
                        ? 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 opacity-60 cursor-not-allowed'
                        : isCurrentDay
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md cursor-pointer'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm cursor-pointer'
                    }`}
                    onClick={() => !isPast && onDateClick(day)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            isPast
                              ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 opacity-60'
                              : isCurrentDay
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200'
                          }`}
                        >
                          {format(day, 'd')}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-slate-100">
                            {format(day, 'EEEE')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">
                            {format(day, 'MMMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                      {dayAppointments.length > 0 && (
                        <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                          {dayAppointments.length}
                        </div>
                      )}
                    </div>
                    {dayAppointments.length > 0 ? (
                      <div className="space-y-2">
                        {dayAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              onAppointmentClick(apt)
                            }}
                            className={`p-3 rounded-lg cursor-pointer active:scale-[0.98] transition-transform ${
                              apt.status === 'scheduled'
                                ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                                : apt.status === 'completed'
                                ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700'
                                : apt.status === 'cancelled'
                                ? 'bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600'
                                : 'bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 dark:text-slate-100 truncate">
                                  {apt.client_name}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-slate-300 mt-0.5">
                                  {format(new Date(apt.scheduled_at), 'h:mm a')}
                                </div>
                              </div>
                              <div className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                                apt.status === 'scheduled'
                                  ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                                  : apt.status === 'completed'
                                  ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                                  : 'bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-slate-200'
                              }`}>
                                {apt.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 dark:text-slate-500 text-center py-2">
                        No appointments
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Desktop: Grid view */}
            <div className="hidden sm:grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600 dark:text-slate-300">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day) => {
                const dayAppointments = getAppointmentsForDate(day)
                const isCurrentMonth = isSameDay(day, monthStart) || day > monthStart
                const isCurrentDay = isToday(day)
                const isPast = isPastDate(day)

                return (
                  <motion.div
                    key={day.toISOString()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`min-h-[100px] p-2 border border-gray-200 dark:border-slate-700 rounded-lg transition-colors ${
                      !isCurrentMonth ? 'opacity-40' : ''
                    } ${
                      isPast
                        ? 'bg-gray-50 dark:bg-slate-900/50 opacity-60 cursor-not-allowed'
                        : 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    } ${isCurrentDay ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : isPast ? '' : 'bg-white dark:bg-slate-800/50'}`}
                    onClick={() => !isPast && onDateClick(day)}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isPast
                          ? 'text-gray-400 dark:text-slate-500'
                          : isCurrentDay
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-slate-200'
                      }`}
                    >
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onAppointmentClick(apt)
                          }}
                          className={`text-xs p-1 rounded truncate cursor-pointer ${
                            apt.status === 'scheduled'
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
                              : apt.status === 'completed'
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                              : apt.status === 'cancelled'
                              ? 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200'
                              : 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200'
                          }`}
                        >
                          {format(new Date(apt.scheduled_at), 'h:mm a')} - {apt.client_name}
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}

        {viewMode === 'week' && (
          <>
            {/* Mobile: Simplified list view */}
            <div className="block sm:hidden space-y-4">
              {weekDays.map((day) => {
                const dayAppointments = getAppointmentsForDate(day).sort(
                  (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
                )
                const isCurrentDay = isToday(day)

                return (
                  <div
                    key={day.toISOString()}
                    className={`p-4 border-2 rounded-xl ${
                      isCurrentDay
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            isCurrentDay
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200'
                          }`}
                        >
                          {format(day, 'd')}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-slate-100">
                            {format(day, 'EEEE')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">
                            {format(day, 'MMM d')}
                          </div>
                        </div>
                      </div>
                      {dayAppointments.length > 0 && (
                        <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                          {dayAppointments.length}
                        </div>
                      )}
                    </div>
                    {dayAppointments.length > 0 ? (
                      <div className="space-y-2">
                        {dayAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={() => onAppointmentClick(apt)}
                            className="p-3 bg-blue-100 border border-blue-200 rounded-lg cursor-pointer active:scale-[0.98] transition-transform"
                          >
                            <div className="font-semibold text-gray-900">
                              {apt.client_name}
                            </div>
                            <div className="text-sm text-gray-600 mt-0.5">
                              {format(new Date(apt.scheduled_at), 'h:mm a')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`p-4 border-2 border-dashed rounded-lg text-center text-sm transition-transform ${
                          isPastDate(day)
                            ? 'border-gray-200 dark:border-slate-700 text-gray-300 dark:text-slate-600 cursor-not-allowed opacity-50'
                            : 'border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500 cursor-pointer active:scale-[0.98] hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                        onClick={() => !isPastDate(day) && onDateClick(day)}
                      >
                        Tap to add appointment
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Desktop: Grid view */}
            <div className="hidden sm:grid grid-cols-8 gap-2">
              {/* Time column header */}
              <div className="col-span-1"></div>
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="text-center">
                  <div className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                    {format(day, 'EEE')}
                  </div>
                  <div
                    className={`text-lg font-bold mt-1 ${
                      isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-slate-100'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
              ))}

              {/* Appointments grid */}
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="contents">
                  <div className="text-xs text-gray-500 dark:text-slate-400 p-2 border-r border-gray-200 dark:border-slate-700">
                    {format(addHours(startOfDay(new Date()), hour), 'h a')}
                  </div>
                  {weekDays.map((day) => {
                    const dayAppointments = getAppointmentsForDate(day).filter((apt) => {
                      const aptHour = new Date(apt.scheduled_at).getHours()
                      return aptHour === hour
                    })

                    const dateTime = new Date(day)
                    dateTime.setHours(hour, 0, 0, 0)
                    const isPast = isPastDateTime(dateTime)

                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={`min-h-[60px] p-1 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 ${
                          isPast
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (!isPast) {
                            onDateClick(dateTime)
                          }
                        }}
                      >
                        {dayAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              onAppointmentClick(apt)
                            }}
                            className="text-xs p-1 rounded mb-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/60"
                          >
                            {format(new Date(apt.scheduled_at), 'h:mm')} - {apt.client_name}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </>
        )}

        {viewMode === 'day' && (
          <div className="space-y-3 sm:space-y-2 max-h-[600px] sm:max-h-none overflow-y-auto">
            {dayHours.map((hour) => {
                const hourAppointments = appointments
                  .filter((apt) => {
                    const aptDate = new Date(apt.scheduled_at)
                    return (
                      isSameDay(aptDate, currentDate) &&
                      aptDate.getHours() === hour.getHours()
                    )
                  })
                  .sort(
                    (a, b) =>
                      new Date(a.scheduled_at).getTime() -
                      new Date(b.scheduled_at).getTime()
                  )

                return (
                  <div
                    key={hour.toISOString()}
                    className="flex gap-3 sm:gap-4 min-h-[80px] sm:min-h-[80px] border-b border-gray-200 dark:border-slate-700 pb-3 sm:pb-2"
                  >
                    <div className="w-16 sm:w-20 text-sm font-medium text-gray-600 dark:text-slate-300 pt-2 flex-shrink-0">
                      {format(hour, 'h:mm a')}
                    </div>
                    <div className="flex-1 min-w-0">
                      {hourAppointments.length > 0 ? (
                        <div className="space-y-2">
                          {hourAppointments.map((apt) => (
                            <div
                              key={apt.id}
                              onClick={() => onAppointmentClick(apt)}
                              className="sm:hidden"
                            >
                              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg cursor-pointer active:scale-[0.98] transition-transform">
                                <div className="font-semibold text-gray-900 dark:text-slate-100 truncate">
                                  {apt.client_name}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-slate-300 mt-0.5">
                                  {format(new Date(apt.scheduled_at), 'h:mm a')}
                                </div>
                              </div>
                            </div>
                          ))}
                          {hourAppointments.map((apt) => (
                            <div key={apt.id} className="hidden sm:block">
                              <AppointmentCard
                                appointment={apt}
                                onClick={() => onAppointmentClick(apt)}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          className={`h-full min-h-[60px] border-2 border-dashed rounded-lg transition-colors flex items-center justify-center text-sm p-4 touch-manipulation ${
                            isPastDateTime(hour)
                              ? 'border-gray-200 dark:border-slate-700 text-gray-300 dark:text-slate-600 cursor-not-allowed opacity-50'
                              : 'border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-gray-400 dark:text-slate-500 active:scale-[0.98]'
                          }`}
                          onClick={() => !isPastDateTime(hour) && onDateClick(hour)}
                        >
                          <span className="hidden sm:inline">Click to add appointment</span>
                          <span className="sm:hidden">Tap to add</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}


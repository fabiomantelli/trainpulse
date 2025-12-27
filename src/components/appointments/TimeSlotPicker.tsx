'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { isToday, startOfDay } from 'date-fns'

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = i % 2 === 0 ? 0 : 30
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
})

const durationPresets = [15, 30, 45, 60, 90, 120]

export default function TimeSlotPicker({
  selectedTime,
  selectedDuration,
  onTimeChange,
  onDurationChange,
  selectedDate,
}: {
  selectedTime: string
  selectedDuration: number
  onTimeChange: (time: string) => void
  onDurationChange: (duration: number) => void
  selectedDate?: Date
}) {
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showDurationPicker, setShowDurationPicker] = useState(false)

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const isTimeSlotDisabled = (time: string) => {
    if (!selectedDate || !isToday(selectedDate)) {
      return false
    }
    const now = new Date()
    const [hours, minutes] = time.split(':').map(Number)
    const timeSlot = new Date(selectedDate)
    timeSlot.setHours(hours, minutes, 0, 0)
    return timeSlot < now
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Time Picker */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Time
        </label>
        <button
          type="button"
          onClick={() => setShowTimePicker(!showTimePicker)}
          className="w-full px-4 py-2.5 text-left bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg shadow-sm hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-gray-900 dark:text-slate-100"
        >
          {formatTime(selectedTime)}
        </button>

        {showTimePicker && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowTimePicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg dark:shadow-slate-900/50 max-h-60 overflow-auto"
            >
              <div className="p-2">
                {timeSlots.map((time) => {
                  const isDisabled = isTimeSlotDisabled(time)
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (!isDisabled) {
                          onTimeChange(time)
                          setShowTimePicker(false)
                        }
                      }}
                      className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors ${
                        isDisabled
                          ? 'text-gray-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                          : selectedTime === time
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/40'
                          : 'text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {formatTime(time)}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Duration Picker */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Duration
        </label>
        <button
          type="button"
          onClick={() => setShowDurationPicker(!showDurationPicker)}
          className="w-full px-4 py-2.5 text-left bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg shadow-sm hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-gray-900 dark:text-slate-100"
        >
          {selectedDuration} min
        </button>

        {showDurationPicker && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowDurationPicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg dark:shadow-slate-900/50"
            >
              <div className="p-2">
                {durationPresets.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => {
                      onDurationChange(duration)
                      setShowDurationPicker(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm rounded-md hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors ${
                      selectedDuration === duration
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    {duration} min
                  </button>
                ))}
                <div className="border-t border-gray-200 dark:border-slate-700 mt-2 pt-2">
                  <input
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    placeholder="Custom (15-240 min)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      if (value >= 15 && value <= 240) {
                        onDurationChange(value)
                      }
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

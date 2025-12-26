import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, formatDistanceToNow, isToday, isTomorrow, addHours, isBefore, differenceInHours, differenceInDays } from 'date-fns'
import { Database } from '@/types/database.types'

type Notification = Database['public']['Tables']['notifications']['Row']
type Appointment = Database['public']['Tables']['appointments']['Row']
type Invoice = Database['public']['Tables']['invoices']['Row']
type Client = Database['public']['Tables']['clients']['Row']

export interface NotificationItem {
  id: string
  type: Notification['type']
  title: string
  message: string
  relatedId: string | null
  relatedType: string | null
  readAt: string | null
  createdAt: string
  isRead: boolean
  href?: string
}

const STORAGE_KEY_PREFIX = 'notifications_read_'

export function useNotifications(trainerId: string | null) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const readRealTimeIdsRef = useRef<Set<string>>(new Set())
  const supabase = createClient()

  // Load persisted read notification IDs from localStorage
  useEffect(() => {
    if (trainerId && typeof window !== 'undefined') {
      try {
        const storageKey = `${STORAGE_KEY_PREFIX}${trainerId}`
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const data = JSON.parse(stored)
          // Support both old format (array) and new format (object with ids)
          const ids = Array.isArray(data) ? data : (data.ids || [])
          readRealTimeIdsRef.current = new Set(ids)
          
          // Clean up entries older than 30 days
          if (data.lastUpdated && Date.now() - data.lastUpdated > 30 * 24 * 60 * 60 * 1000) {
            readRealTimeIdsRef.current.clear()
            localStorage.removeItem(storageKey)
          }
        }
      } catch (error) {
        console.error('Error loading read notifications from localStorage:', error)
        // If there's a parsing error, clear the corrupted data
        try {
          const storageKey = `${STORAGE_KEY_PREFIX}${trainerId}`
          localStorage.removeItem(storageKey)
        } catch (clearError) {
          // Ignore clear errors
        }
      }
    }
  }, [trainerId])

  // Helper to save read notification IDs to localStorage
  const persistReadIds = useCallback(() => {
    if (trainerId && typeof window !== 'undefined') {
      try {
        const storageKey = `${STORAGE_KEY_PREFIX}${trainerId}`
        const ids = Array.from(readRealTimeIdsRef.current)
        // Store with timestamp for cleanup purposes
        const data = {
          ids,
          lastUpdated: Date.now(),
        }
        localStorage.setItem(storageKey, JSON.stringify(data))
        
        // Clean up old entries periodically (keep only last 1000 IDs to prevent bloat)
        if (ids.length > 1000) {
          const trimmedIds = ids.slice(-1000)
          readRealTimeIdsRef.current = new Set(trimmedIds)
          localStorage.setItem(storageKey, JSON.stringify({ ids: trimmedIds, lastUpdated: Date.now() }))
        }
      } catch (error) {
        console.error('Error saving read notifications to localStorage:', error)
        // If localStorage is full, try to clean up
        if (error instanceof DOMException && error.code === 22) {
          try {
            const storageKey = `${STORAGE_KEY_PREFIX}${trainerId}`
            const ids = Array.from(readRealTimeIdsRef.current).slice(-500)
            readRealTimeIdsRef.current = new Set(ids)
            localStorage.setItem(storageKey, JSON.stringify({ ids, lastUpdated: Date.now() }))
          } catch (cleanupError) {
            console.error('Error cleaning up localStorage:', cleanupError)
          }
        }
      }
    }
  }, [trainerId])

  const calculateRealTimeNotifications = useCallback(async (): Promise<NotificationItem[]> => {
    if (!trainerId) return []

    const realTimeNotifications: NotificationItem[] = []
    const now = new Date()

    // Fetch appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select(`
        *,
        clients:client_id (
          name
        )
      `)
      .eq('trainer_id', trainerId)
      .eq('status', 'scheduled')
      .gte('scheduled_at', now.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(50)

    if (appointments) {
      appointments.forEach((apt: any) => {
        const scheduledAt = new Date(apt.scheduled_at)
        const hoursUntil = differenceInHours(scheduledAt, now)
        const clientName = apt.clients?.name || 'Client'

        // Appointment in 1 hour
        if (hoursUntil >= 0 && hoursUntil <= 1) {
          realTimeNotifications.push({
            id: `appt-reminder-${apt.id}`,
            type: 'appointment_reminder',
            title: 'Appointment Reminder',
            message: `${clientName} - ${format(scheduledAt, 'h:mm a')}`,
            relatedId: apt.id,
            relatedType: 'appointment',
            readAt: null,
            createdAt: scheduledAt.toISOString(),
            isRead: false,
            href: `/appointments/${apt.id}`,
          })
        }

        // Appointments today
        if (isToday(scheduledAt)) {
          realTimeNotifications.push({
            id: `appt-today-${apt.id}`,
            type: 'appointment_upcoming',
            title: 'Appointment Today',
            message: `${clientName} at ${format(scheduledAt, 'h:mm a')}`,
            relatedId: apt.id,
            relatedType: 'appointment',
            readAt: null,
            createdAt: scheduledAt.toISOString(),
            isRead: false,
            href: `/appointments/${apt.id}`,
          })
        }

        // Appointments tomorrow
        if (isTomorrow(scheduledAt)) {
          realTimeNotifications.push({
            id: `appt-tomorrow-${apt.id}`,
            type: 'appointment_upcoming',
            title: 'Appointment Tomorrow',
            message: `${clientName} at ${format(scheduledAt, 'h:mm a')}`,
            relatedId: apt.id,
            relatedType: 'appointment',
            readAt: null,
            createdAt: scheduledAt.toISOString(),
            isRead: false,
            href: `/appointments/${apt.id}`,
          })
        }
      })
    }

    // Fetch invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select(`
        *,
        clients:client_id (
          name
        )
      `)
      .eq('trainer_id', trainerId)
      .in('status', ['sent', 'overdue'])
      .order('due_date', { ascending: true })
      .limit(50)

    if (invoices) {
      invoices.forEach((inv: any) => {
        if (!inv.due_date) return

        const dueDate = new Date(inv.due_date)
        const daysUntil = differenceInDays(dueDate, now)
        const clientName = inv.clients?.name || 'Client'

        // Overdue invoices
        if (inv.status === 'overdue' || (isBefore(dueDate, now) && inv.status === 'sent')) {
          realTimeNotifications.push({
            id: `invoice-overdue-${inv.id}`,
            type: 'invoice_overdue',
            title: 'Overdue Invoice',
            message: `${clientName} - $${inv.amount.toFixed(2)}`,
            relatedId: inv.id,
            relatedType: 'invoice',
            readAt: null,
            createdAt: inv.created_at,
            isRead: false,
            href: `/invoices/${inv.id}`,
          })
        }
        // Invoices due in 3 days
        else if (daysUntil >= 0 && daysUntil <= 3 && inv.status === 'sent') {
          realTimeNotifications.push({
            id: `invoice-due-${inv.id}`,
            type: 'invoice_due_soon',
            title: 'Invoice Due Soon',
            message: `${clientName} - $${inv.amount.toFixed(2)} (${daysUntil === 0 ? 'today' : `${daysUntil} days`})`,
            relatedId: inv.id,
            relatedType: 'invoice',
            readAt: null,
            createdAt: inv.created_at,
            isRead: false,
            href: `/invoices/${inv.id}`,
          })
        }
      })
    }

    return realTimeNotifications
  }, [trainerId, supabase])

  const fetchNotifications = useCallback(async () => {
    if (!trainerId) {
      setLoading(false)
      return
    }

    try {
      // Fetch stored notifications
      const { data: storedNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('trainer_id', trainerId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching notifications:', error)
      }

      // Calculate real-time notifications
      const realTimeNotifications = await calculateRealTimeNotifications()

      // Combine and deduplicate
      const allNotifications: NotificationItem[] = []
      const seenIds = new Set<string>()

      // Add real-time notifications first (they're more important)
      // Filter out ones that have been marked as read
      realTimeNotifications.forEach((notif) => {
        if (!seenIds.has(notif.id) && !readRealTimeIdsRef.current.has(notif.id)) {
          allNotifications.push(notif)
          seenIds.add(notif.id)
        }
      })

      // Add stored notifications
      if (storedNotifications) {
        (storedNotifications as Notification[]).forEach((notif) => {
          if (!seenIds.has(notif.id)) {
            allNotifications.push({
              id: notif.id,
              type: notif.type,
              title: notif.title,
              message: notif.message,
              relatedId: notif.related_id,
              relatedType: notif.related_type,
              readAt: notif.read_at,
              createdAt: notif.created_at,
              isRead: !!notif.read_at,
              href: notif.related_id && notif.related_type
                ? `/${notif.related_type}s/${notif.related_id}`
                : undefined,
            })
            seenIds.add(notif.id)
          }
        })
      }

      // Sort by created_at (newest first), unread first
      allNotifications.sort((a, b) => {
        if (a.isRead !== b.isRead) {
          return a.isRead ? 1 : -1
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

      // Filter out read real-time notifications from final list
      const filteredNotifications = allNotifications.filter((n) => {
        if (n.id.startsWith('appt-') || n.id.startsWith('invoice-')) {
          return !readRealTimeIdsRef.current.has(n.id)
        }
        return true
      })
      
      setNotifications(filteredNotifications)
      setUnreadCount(filteredNotifications.filter((n) => !n.isRead).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [trainerId, supabase, calculateRealTimeNotifications])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Check if it's a real-time notification (starts with prefix)
      if (notificationId.startsWith('appt-') || notificationId.startsWith('invoice-')) {
        // For real-time notifications, mark as read and add to read set
        readRealTimeIdsRef.current.add(notificationId)
        persistReadIds() // Persist to localStorage
        setNotifications((prev) => {
          const updated = prev.filter((n) => n.id !== notificationId)
          // Recalculate unread count
          const newUnreadCount = updated.filter((n) => !n.isRead).length
          setUnreadCount(newUnreadCount)
          return updated
        })
        return
      }

      // For stored notifications, update in database
      const { error } = await (supabase.from('notifications') as any)
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('trainer_id', trainerId!)

      if (!error) {
        setNotifications((prev) => {
          const updated = prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
          // Recalculate unread count
          const newUnreadCount = updated.filter((n) => !n.isRead).length
          setUnreadCount(newUnreadCount)
          return updated
        })
      }
    },
    [trainerId, supabase, persistReadIds]
  )

  const markAllAsRead = useCallback(async () => {
    if (!trainerId) return

    // Mark all stored unread notifications in database
    const { error } = await (supabase.from('notifications') as any)
      .update({ read_at: new Date().toISOString() })
      .eq('trainer_id', trainerId)
      .is('read_at', null)

    if (error) {
      console.error('Error marking all as read:', error)
      return
    }

    // Mark all real-time notifications as read
    setNotifications((prev) => {
      const realTimeIds = prev
        .filter((n) => n.id.startsWith('appt-') || n.id.startsWith('invoice-'))
        .map((n) => n.id)
      // Add all real-time notification IDs to the read set
      realTimeIds.forEach((id) => readRealTimeIdsRef.current.add(id))
      persistReadIds() // Persist to localStorage
      // Remove all real-time notifications and update stored ones
      const updated = prev
        .filter((n) => !n.id.startsWith('appt-') && !n.id.startsWith('invoice-'))
        .map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      setUnreadCount(0)
      return updated
    })
  }, [trainerId, supabase, persistReadIds])

  useEffect(() => {
    if (trainerId) {
      fetchNotifications()
      
      // Set up polling every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [trainerId, fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  }
}


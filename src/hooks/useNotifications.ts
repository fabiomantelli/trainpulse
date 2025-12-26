import { useState, useEffect, useCallback } from 'react'
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

export function useNotifications(trainerId: string | null) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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
      realTimeNotifications.forEach((notif) => {
        if (!seenIds.has(notif.id)) {
          allNotifications.push(notif)
          seenIds.add(notif.id)
        }
      })

      // Add stored notifications
      if (storedNotifications) {
        storedNotifications.forEach((notif) => {
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

      setNotifications(allNotifications)
      setUnreadCount(allNotifications.filter((n) => !n.isRead).length)
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
        // For real-time notifications, just update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
        return
      }

      // For stored notifications, update in database
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('trainer_id', trainerId!)

      if (!error) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    },
    [trainerId, supabase]
  )

  const markAllAsRead = useCallback(async () => {
    if (!trainerId) return

    // Mark all stored unread notifications
    const unreadStored = notifications.filter((n) => !n.isRead && !n.id.startsWith('appt-') && !n.id.startsWith('invoice-'))
    
    if (unreadStored.length > 0) {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('trainer_id', trainerId)
        .is('read_at', null)

      if (error) {
        console.error('Error marking all as read:', error)
        return
      }
    }

    // Update local state for all notifications
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    )
    setUnreadCount(0)
  }, [trainerId, supabase, notifications])

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


import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

interface EngagementNotification {
  day: number
  title: string
  message: string
  relatedType?: string
}

const ENGAGEMENT_NOTIFICATIONS: EngagementNotification[] = [
  {
    day: 1,
    title: 'Welcome to TrainPulse! 🎉',
    message:
      'Get started by adding your first client and connecting your Stripe account. You have 30 days free to explore all features!',
    relatedType: 'onboarding',
  },
  {
    day: 3,
    title: 'Have you added your first client yet?',
    message:
      'Adding clients is easy! Click here to get started and begin managing your fitness business.',
    relatedType: 'onboarding',
  },
  {
    day: 7,
    title: 'Connect Stripe to start accepting payments',
    message:
      'Link your Stripe account to accept payments from clients and issue invoices with automatic tax calculation.',
    relatedType: 'onboarding',
  },
  {
    day: 20,
    title: 'Your trial ends in 10 days',
    message:
      'Upgrade now to lock in Early Adopter pricing at $19/month forever! Only a few spots remaining.',
    relatedType: 'subscription',
  },
  {
    day: 25,
    title: 'Last chance: Lock in Early Adopter pricing',
    message:
      'Your trial ends in 5 days. Upgrade now to secure $19/month forever before the price increases to $29/month.',
    relatedType: 'subscription',
  },
]

/**
 * Check and create engagement notifications for users
 * Should be called daily (e.g., via cron job or scheduled function)
 */
export async function checkEngagementNotifications() {
  const supabase = createClient()

  try {
    // Get all profiles with trialing status
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, created_at, subscription_status, stripe_account_id')
      .eq('subscription_status', 'trialing')

    if (error) {
      console.error('Error fetching trialing profiles:', error)
      throw error
    }

    if (!profiles) return { checked: 0, notified: 0 }

    // Type assertion for the selected columns
    const typedProfiles = profiles as Pick<Profile, 'id' | 'created_at' | 'subscription_status' | 'stripe_account_id'>[]

    let notified = 0
    const now = new Date()

    for (const profile of typedProfiles) {
      if (!profile.created_at) continue

      const createdDate = new Date(profile.created_at)
      const daysSinceSignup = Math.floor(
        (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Find matching notification for this day
      const notification = ENGAGEMENT_NOTIFICATIONS.find((n) => n.day === daysSinceSignup)

      if (!notification) continue

      // Check if notification already exists
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('trainer_id', profile.id)
        .eq('type', 'system_update')
        .eq('title', notification.title)
        .limit(1)
        .single()

      if (existingNotification) continue

      // Special handling for day 3 - check if client exists
      if (notification.day === 3) {
        const { count: clientsCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('trainer_id', profile.id)

        if (clientsCount && clientsCount > 0) {
          continue // Skip if client already exists
        }
      }

      // Special handling for day 7 - check if Stripe is connected
      if (notification.day === 7) {
        if (profile.stripe_account_id) {
          continue // Skip if Stripe already connected
        }
      }

      // Create notification
      const notificationData: NotificationInsert = {
        trainer_id: profile.id,
        type: 'system_update',
        title: notification.title,
        message: notification.message,
        related_type: notification.relatedType || 'engagement',
      }
      await (supabase.from('notifications') as any).insert(notificationData)

      notified++
    }

    return { checked: typedProfiles.length, notified }
  } catch (error) {
    console.error('Failed to check engagement notifications:', error)
    throw error
  }
}

/**
 * Create SQL function for engagement notifications
 * This can be called via cron job in Supabase
 */
export const ENGAGEMENT_NOTIFICATIONS_SQL = `
CREATE OR REPLACE FUNCTION public.check_engagement_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
  days_since_signup INT;
  notification_record RECORD;
  clients_count INT;
BEGIN
  -- Loop through all profiles with trialing status
  FOR profile_record IN
    SELECT 
      p.id,
      p.created_at,
      p.subscription_status,
      p.stripe_account_id
    FROM public.profiles p
    WHERE p.subscription_status = 'trialing'
      AND p.created_at IS NOT NULL
  LOOP
    days_since_signup := EXTRACT(DAY FROM (NOW() - profile_record.created_at))::INT;

    -- Day 1: Welcome
    IF days_since_signup = 1 THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE trainer_id = profile_record.id
          AND type = 'system_update'
          AND title = 'Welcome to TrainPulse! 🎉'
          AND DATE(created_at) = CURRENT_DATE
      ) THEN
        INSERT INTO public.notifications (
          trainer_id, type, title, message, related_type
        ) VALUES (
          profile_record.id,
          'system_update',
          'Welcome to TrainPulse! 🎉',
          'Get started by adding your first client and connecting your Stripe account. You have 30 days free to explore all features!',
          'onboarding'
        );
      END IF;
    END IF;

    -- Day 3: Add first client
    IF days_since_signup = 3 THEN
      SELECT COUNT(*) INTO clients_count
      FROM public.clients
      WHERE trainer_id = profile_record.id;

      IF clients_count = 0 AND NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE trainer_id = profile_record.id
          AND type = 'system_update'
          AND title = 'Have you added your first client yet?'
          AND DATE(created_at) = CURRENT_DATE
      ) THEN
        INSERT INTO public.notifications (
          trainer_id, type, title, message, related_type
        ) VALUES (
          profile_record.id,
          'system_update',
          'Have you added your first client yet?',
          'Adding clients is easy! Click here to get started and begin managing your fitness business.',
          'onboarding'
        );
      END IF;
    END IF;

    -- Day 7: Connect Stripe
    IF days_since_signup = 7 THEN
      IF profile_record.stripe_account_id IS NULL AND NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE trainer_id = profile_record.id
          AND type = 'system_update'
          AND title = 'Connect Stripe to start accepting payments'
          AND DATE(created_at) = CURRENT_DATE
      ) THEN
        INSERT INTO public.notifications (
          trainer_id, type, title, message, related_type
        ) VALUES (
          profile_record.id,
          'system_update',
          'Connect Stripe to start accepting payments',
          'Link your Stripe account to accept payments from clients and issue invoices with automatic tax calculation.',
          'onboarding'
        );
      END IF;
    END IF;

    -- Day 20: Trial ending soon
    IF days_since_signup = 20 THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE trainer_id = profile_record.id
          AND type = 'system_update'
          AND title = 'Your trial ends in 10 days'
          AND DATE(created_at) = CURRENT_DATE
      ) THEN
        INSERT INTO public.notifications (
          trainer_id, type, title, message, related_type
        ) VALUES (
          profile_record.id,
          'system_update',
          'Your trial ends in 10 days',
          'Upgrade now to lock in Early Adopter pricing at $19/month forever! Only a few spots remaining.',
          'subscription'
        );
      END IF;
    END IF;

    -- Day 25: Last chance
    IF days_since_signup = 25 THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE trainer_id = profile_record.id
          AND type = 'system_update'
          AND title = 'Last chance: Lock in Early Adopter pricing'
          AND DATE(created_at) = CURRENT_DATE
      ) THEN
        INSERT INTO public.notifications (
          trainer_id, type, title, message, related_type
        ) VALUES (
          profile_record.id,
          'system_update',
          'Last chance: Lock in Early Adopter pricing',
          'Your trial ends in 5 days. Upgrade now to secure $19/month forever before the price increases to $29/month.',
          'subscription'
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.check_engagement_notifications() IS 'Checks for engagement notifications based on days since signup. Should be called daily.';
`


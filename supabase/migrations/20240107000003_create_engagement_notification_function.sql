-- Function to check and create engagement notifications
-- Should be called daily via cron job
CREATE OR REPLACE FUNCTION public.check_engagement_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
  days_since_signup INT;
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
          trainer_id, type, title, message, related_type, related_id
        ) VALUES (
          profile_record.id,
          'system_update',
          'Welcome to TrainPulse! 🎉',
          'Get started by adding your first client and connecting your Stripe account. You have 30 days free to explore all features!',
          'onboarding',
          profile_record.id
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
          trainer_id, type, title, message, related_type, related_id
        ) VALUES (
          profile_record.id,
          'system_update',
          'Have you added your first client yet?',
          'Adding clients is easy! Click here to get started and begin managing your fitness business.',
          'onboarding',
          profile_record.id
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
          trainer_id, type, title, message, related_type, related_id
        ) VALUES (
          profile_record.id,
          'system_update',
          'Connect Stripe to start accepting payments',
          'Link your Stripe account to accept payments from clients and issue invoices with automatic tax calculation.',
          'onboarding',
          profile_record.id
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
          trainer_id, type, title, message, related_type, related_id
        ) VALUES (
          profile_record.id,
          'system_update',
          'Your trial ends in 10 days',
          'Upgrade now to lock in Early Adopter pricing at $19/month forever! Only a few spots remaining.',
          'subscription',
          profile_record.id
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
          trainer_id, type, title, message, related_type, related_id
        ) VALUES (
          profile_record.id,
          'system_update',
          'Last chance: Lock in Early Adopter pricing',
          'Your trial ends in 5 days. Upgrade now to secure $19/month forever before the price increases to $29/month.',
          'subscription',
          profile_record.id
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.check_engagement_notifications() IS 'Checks for engagement notifications based on days since signup. Should be called daily.';


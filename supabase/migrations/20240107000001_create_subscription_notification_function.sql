-- Function to check for expiring trials and create notifications
CREATE OR REPLACE FUNCTION public.check_expiring_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
  days_until_expiry INT;
BEGIN
  -- Loop through all profiles with trialing status
  FOR profile_record IN
    SELECT 
      p.id,
      p.trial_ends_at,
      p.subscription_status
    FROM public.profiles p
    WHERE p.subscription_status = 'trialing'
      AND p.trial_ends_at IS NOT NULL
  LOOP
    days_until_expiry := EXTRACT(DAY FROM (profile_record.trial_ends_at - NOW()))::INT;

    -- Check if trial expired
    IF profile_record.trial_ends_at < NOW() THEN
      -- Check if notification already exists
      IF NOT EXISTS (
        SELECT 1
        FROM public.notifications
        WHERE trainer_id = profile_record.id
          AND type = 'system_update'
          AND related_type = 'subscription'
          AND title ILIKE '%trial expired%'
          AND DATE(created_at) = CURRENT_DATE
      ) THEN
        INSERT INTO public.notifications (
          trainer_id,
          type,
          title,
          message,
          related_type,
          related_id
        ) VALUES (
          profile_record.id,
          'system_update',
          'Trial Expired',
          'Your free trial has ended. Upgrade to continue using TrainPulse.',
          'subscription',
          profile_record.id
        );
      END IF;
    -- Check if trial expires in 7 days
    ELSIF days_until_expiry = 7 THEN
      -- Check if notification already exists
      IF NOT EXISTS (
        SELECT 1
        FROM public.notifications
        WHERE trainer_id = profile_record.id
          AND type = 'system_update'
          AND related_type = 'subscription'
          AND title ILIKE '%trial expiring%'
          AND DATE(created_at) = CURRENT_DATE
      ) THEN
        INSERT INTO public.notifications (
          trainer_id,
          type,
          title,
          message,
          related_type,
          related_id
        ) VALUES (
          profile_record.id,
          'system_update',
          'Trial Expiring Soon',
          'Your free trial ends in 7 days. Upgrade now to continue using TrainPulse.',
          'subscription',
          profile_record.id
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.check_expiring_trials() IS 'Checks for expiring trials and creates notifications. Should be called daily.';


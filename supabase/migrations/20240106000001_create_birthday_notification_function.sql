-- Function to check for client birthdays and create notifications
CREATE OR REPLACE FUNCTION public.check_client_birthdays()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_record RECORD;
  today_month INT;
  today_day INT;
BEGIN
  -- Get today's month and day
  today_month := EXTRACT(MONTH FROM CURRENT_DATE);
  today_day := EXTRACT(DAY FROM CURRENT_DATE);

  -- Loop through all clients with a date_of_birth
  FOR client_record IN
    SELECT 
      c.id,
      c.trainer_id,
      c.name,
      c.date_of_birth
    FROM public.clients c
    WHERE c.date_of_birth IS NOT NULL
      AND EXTRACT(MONTH FROM c.date_of_birth) = today_month
      AND EXTRACT(DAY FROM c.date_of_birth) = today_day
  LOOP
    -- Check if notification already exists for today
    IF NOT EXISTS (
      SELECT 1
      FROM public.notifications
      WHERE trainer_id = client_record.trainer_id
        AND type = 'client_birthday'
        AND related_id = client_record.id::text
        AND related_type = 'client'
        AND DATE(created_at) = CURRENT_DATE
    ) THEN
      -- Create birthday notification
      INSERT INTO public.notifications (
        trainer_id,
        type,
        title,
        message,
        related_id,
        related_type
      ) VALUES (
        client_record.trainer_id,
        'client_birthday',
        'Client Birthday',
        client_record.name || '''s birthday is today!',
        client_record.id::text,
        'client'
      );
    END IF;
  END LOOP;
END;
$$;

-- Create a function that can be called via cron or scheduled job
-- This function can be called daily to check for birthdays
COMMENT ON FUNCTION public.check_client_birthdays() IS 'Checks for client birthdays on the current date and creates notifications';


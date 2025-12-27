-- Add subscription fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Create index for trial_ends_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at ON public.profiles(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON public.profiles(stripe_subscription_id);

-- Update the profile creation trigger to set trial_ends_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, timezone, trial_ends_at, subscription_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    NOW() + INTERVAL '30 days', -- 30-day trial
    'trialing' -- Start with trialing status
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing profiles that don't have trial_ends_at set
UPDATE public.profiles
SET trial_ends_at = created_at + INTERVAL '30 days'
WHERE trial_ends_at IS NULL AND subscription_status = 'trialing';


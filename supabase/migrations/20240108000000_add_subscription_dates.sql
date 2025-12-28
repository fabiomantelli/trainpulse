-- Add subscription period dates to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_cancel_at TIMESTAMPTZ;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_current_period_end ON public.profiles(subscription_current_period_end);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_cancel_at ON public.profiles(subscription_cancel_at);


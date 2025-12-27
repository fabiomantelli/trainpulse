-- Add early adopter field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_early_adopter BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_early_adopter ON public.profiles(is_early_adopter);

-- Function to get count of active early adopters
CREATE OR REPLACE FUNCTION public.get_early_adopter_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.profiles
  WHERE is_early_adopter = true
    AND subscription_status IN ('active', 'trialing')
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION public.get_early_adopter_count() IS 'Returns the count of active early adopters (with active or trialing subscriptions)';

-- Function to atomically check and mark as early adopter
-- This prevents race conditions when multiple users try to become early adopters simultaneously
-- Uses advisory lock to ensure only one user can check/update at a time
CREATE OR REPLACE FUNCTION public.try_mark_early_adopter(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_max_early_adopters INTEGER := 100;
  v_lock_id BIGINT := 12345; -- Fixed lock ID for early adopter operations
  v_acquired BOOLEAN;
BEGIN
  -- Check if user is already an early adopter (fast path, no lock needed)
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_user_id AND is_early_adopter = true
  ) THEN
    RETURN true; -- Already an early adopter
  END IF;
  
  -- Try to acquire advisory lock (non-blocking)
  v_acquired := pg_try_advisory_xact_lock(v_lock_id);
  
  IF NOT v_acquired THEN
    -- Could not acquire lock, another transaction is processing
    -- Wait a bit and check again (this is a fallback)
    PERFORM pg_sleep(0.1);
    v_acquired := pg_try_advisory_xact_lock(v_lock_id);
    
    IF NOT v_acquired THEN
      -- Still can't acquire lock, return false to use standard pricing
      RETURN false;
    END IF;
  END IF;
  
  -- Now we have the lock, get current count
  SELECT public.get_early_adopter_count() INTO v_current_count;
  
  -- Check if we still have slots available
  IF v_current_count >= v_max_early_adopters THEN
    RETURN false; -- No slots available
  END IF;
  
  -- Mark as early adopter (only if not already marked and count is still < max)
  UPDATE public.profiles
  SET is_early_adopter = true
  WHERE id = p_user_id
    AND is_early_adopter = false
    AND (SELECT public.get_early_adopter_count()) < v_max_early_adopters;
  
  -- Return true if we successfully marked them
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND is_early_adopter = true
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.try_mark_early_adopter(UUID) IS 'Atomically attempts to mark a user as early adopter if slots are available. Returns true if successful, false otherwise.';


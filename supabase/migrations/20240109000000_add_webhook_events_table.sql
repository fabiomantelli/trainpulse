-- Table to track processed webhook events for idempotency
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY, -- Stripe event ID (evt_xxx)
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_id ON public.webhook_events(id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON public.webhook_events(processed_at);

-- Clean up old events (older than 30 days) - can be run periodically
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_events()
RETURNS void AS $$
BEGIN
  DELETE FROM public.webhook_events
  WHERE processed_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;




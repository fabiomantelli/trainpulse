-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'appointment_upcoming',
    'appointment_reminder',
    'invoice_overdue',
    'invoice_due_soon',
    'client_birthday',
    'workout_reminder',
    'system_update'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  related_type TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_trainer_id ON public.notifications(trainer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Trainers can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert their own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = trainer_id);


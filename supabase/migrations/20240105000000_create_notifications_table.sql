-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'appointment_upcoming',
  'appointment_reminder',
  'invoice_overdue',
  'invoice_due_soon',
  'client_birthday',
  'workout_reminder',
  'system_update'
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID, -- ID of related entity (appointment, invoice, client, etc.)
    related_type TEXT, -- Type of related entity ('appointment', 'invoice', 'client', etc.)
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_notifications_trainer_id ON public.notifications(trainer_id);
CREATE INDEX idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_trainer_unread ON public.notifications(trainer_id, read_at) WHERE read_at IS NULL;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = trainer_id);

-- Users can insert their own notifications
CREATE POLICY "Users can insert their own notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (auth.uid() = trainer_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = trainer_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
    ON public.notifications
    FOR DELETE
    USING (auth.uid() = trainer_id);


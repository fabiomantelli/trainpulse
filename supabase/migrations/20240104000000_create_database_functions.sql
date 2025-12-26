-- Function to get trainer statistics
CREATE OR REPLACE FUNCTION public.get_trainer_stats(p_trainer_id UUID)
RETURNS TABLE (
  total_clients BIGINT,
  active_clients BIGINT,
  total_appointments BIGINT,
  upcoming_appointments BIGINT,
  total_revenue DECIMAL(10, 2),
  monthly_revenue DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  WITH client_stats AS (
    SELECT 
      COUNT(*)::BIGINT as total_clients,
      COUNT(CASE 
        WHEN EXISTS (
          SELECT 1 FROM public.appointments a 
          WHERE a.client_id = c.id 
          AND a.scheduled_at >= NOW() - INTERVAL '30 days'
        ) THEN 1 
      END)::BIGINT as active_clients
    FROM public.clients c
    WHERE c.trainer_id = p_trainer_id
  ),
  appointment_stats AS (
    SELECT
      COUNT(*)::BIGINT as total_appointments,
      COUNT(CASE 
        WHEN a.scheduled_at >= NOW() 
        AND a.status = 'scheduled' 
        THEN 1 
      END)::BIGINT as upcoming_appointments
    FROM public.appointments a
    WHERE a.trainer_id = p_trainer_id
  ),
  payment_stats AS (
    SELECT
      COALESCE(SUM(p.amount), 0)::DECIMAL(10, 2) as total_revenue,
      COALESCE(SUM(CASE 
        WHEN p.created_at >= DATE_TRUNC('month', NOW()) 
        THEN p.amount 
        ELSE 0 
      END), 0)::DECIMAL(10, 2) as monthly_revenue
    FROM public.payments p
    WHERE p.trainer_id = p_trainer_id
  )
  SELECT 
    cs.total_clients,
    cs.active_clients,
    apt.total_appointments,
    apt.upcoming_appointments,
    pay.total_revenue,
    pay.monthly_revenue
  FROM client_stats cs
  CROSS JOIN appointment_stats apt
  CROSS JOIN payment_stats pay;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get upcoming appointments
CREATE OR REPLACE FUNCTION public.get_upcoming_appointments(
  p_trainer_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  id UUID,
  client_id UUID,
  client_name TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  status TEXT,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.client_id,
    c.name as client_name,
    a.scheduled_at,
    a.duration_minutes,
    a.status,
    a.notes
  FROM public.appointments a
  INNER JOIN public.clients c ON c.id = a.client_id
  WHERE a.trainer_id = p_trainer_id
    AND a.scheduled_at >= NOW()
    AND a.scheduled_at <= NOW() + (p_days || ' days')::INTERVAL
    AND a.status = 'scheduled'
  ORDER BY a.scheduled_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


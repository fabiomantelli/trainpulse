-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Clients policies
CREATE POLICY "Trainers can view their own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert their own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update their own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete their own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = trainer_id);

-- Appointments policies
CREATE POLICY "Trainers can view their own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert their own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update their own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete their own appointments"
  ON public.appointments FOR DELETE
  USING (auth.uid() = trainer_id);

-- Workouts policies
CREATE POLICY "Trainers can view their own workouts"
  ON public.workouts FOR SELECT
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert their own workouts"
  ON public.workouts FOR INSERT
  WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update their own workouts"
  ON public.workouts FOR UPDATE
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete their own workouts"
  ON public.workouts FOR DELETE
  USING (auth.uid() = trainer_id);

-- Workout sessions policies
CREATE POLICY "Trainers can view their own workout sessions"
  ON public.workout_sessions FOR SELECT
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert their own workout sessions"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update their own workout sessions"
  ON public.workout_sessions FOR UPDATE
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete their own workout sessions"
  ON public.workout_sessions FOR DELETE
  USING (auth.uid() = trainer_id);

-- Invoices policies
CREATE POLICY "Trainers can view their own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert their own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update their own invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete their own invoices"
  ON public.invoices FOR DELETE
  USING (auth.uid() = trainer_id);

-- Payments policies
CREATE POLICY "Trainers can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert their own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = trainer_id);








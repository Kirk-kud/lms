-- Meeting schedule: single global row defining recurring meeting days/time

CREATE TABLE IF NOT EXISTS public.meeting_schedule (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  days_of_week text[] NOT NULL,
  time_of_day  time NOT NULL,
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meeting_schedule_start_date_idx ON public.meeting_schedule(start_date);

ALTER TABLE public.meeting_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meeting_schedule_select_authenticated"
  ON public.meeting_schedule
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "meeting_schedule_insert_admin"
  ON public.meeting_schedule
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "meeting_schedule_update_admin"
  ON public.meeting_schedule
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "meeting_schedule_delete_admin"
  ON public.meeting_schedule
  FOR DELETE
  USING (public.is_admin(auth.uid()));

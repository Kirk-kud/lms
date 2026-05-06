ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;

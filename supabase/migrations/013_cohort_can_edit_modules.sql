ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS can_edit_modules boolean NOT NULL DEFAULT false;

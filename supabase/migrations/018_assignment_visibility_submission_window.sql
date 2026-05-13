-- Migration 018: Assignment visibility controls and submission windows

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS published        BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS publish_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS available_until  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reopened_until   TIMESTAMPTZ;

COMMENT ON COLUMN public.assignments.published IS
  'When false the assignment is invisible to students regardless of publish_at.';
COMMENT ON COLUMN public.assignments.publish_at IS
  'If set, the assignment becomes visible to students only after this timestamp (requires published=true).';
COMMENT ON COLUMN public.assignments.available_until IS
  'Hard late-submission cutoff. Submissions between due_date and available_until are accepted and marked late. After available_until the assignment is closed unless reopened_until overrides it.';
COMMENT ON COLUMN public.assignments.reopened_until IS
  'Admin-set reopen window. Overrides available_until. Submissions during this window are marked late.';

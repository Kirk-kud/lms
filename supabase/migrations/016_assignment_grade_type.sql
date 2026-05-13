-- Add grade_type to assignments (score vs pass_fail)
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS grade_type TEXT NOT NULL DEFAULT 'score';

ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_grade_type_check;
ALTER TABLE public.assignments ADD CONSTRAINT assignments_grade_type_check CHECK (
  grade_type IN ('score', 'pass_fail')
);

-- Allow 'missing' status so admins can record a grade for non-submitters in pass/fail mode
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check CHECK (
  status IN ('submitted', 'late', 'missing')
);

-- Relax payload check: records with status='missing' need no content payload
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_payload_check;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_payload_check CHECK (
  status = 'missing'
  OR (
    file_url IS NOT NULL AND file_name IS NOT NULL
    AND (submission_link_url IS NULL OR TRIM(submission_link_url) = '')
    AND (submission_text IS NULL OR TRIM(submission_text) = '')
  )
  OR (
    file_url IS NULL AND file_name IS NULL
    AND submission_text IS NOT NULL AND LENGTH(TRIM(submission_text)) > 0
    AND (submission_link_url IS NULL OR TRIM(submission_link_url) = '')
  )
  OR (
    file_url IS NULL AND file_name IS NULL
    AND submission_link_url IS NOT NULL AND LENGTH(TRIM(submission_link_url)) > 0
    AND (submission_text IS NULL OR TRIM(submission_text) = '')
  )
);

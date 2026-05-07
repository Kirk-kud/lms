-- Optional materials tutors attach to assignments + flexible student submission payloads

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS instruction_file_path TEXT,
  ADD COLUMN IF NOT EXISTS instruction_file_name TEXT,
  ADD COLUMN IF NOT EXISTS instruction_link_url TEXT,
  ADD COLUMN IF NOT EXISTS instruction_text TEXT,
  ADD COLUMN IF NOT EXISTS expected_submission_type TEXT NOT NULL DEFAULT 'pdf_file';

ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_expected_submission_type_check;

ALTER TABLE public.assignments ADD CONSTRAINT assignments_expected_submission_type_check CHECK (
  expected_submission_type IN ('pdf_file', 'text', 'link')
);

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS submission_text TEXT,
  ADD COLUMN IF NOT EXISTS submission_link_url TEXT;

ALTER TABLE public.submissions ALTER COLUMN file_url DROP NOT NULL;
ALTER TABLE public.submissions ALTER COLUMN file_name DROP NOT NULL;

ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_payload_check;

ALTER TABLE public.submissions ADD CONSTRAINT submissions_payload_check CHECK (
  (
    file_url IS NOT NULL
    AND file_name IS NOT NULL
    AND (submission_link_url IS NULL OR TRIM(submission_link_url) = '')
    AND (submission_text IS NULL OR TRIM(submission_text) = '')
  )
  OR (
    file_url IS NULL
    AND file_name IS NULL
    AND submission_text IS NOT NULL
    AND LENGTH(TRIM(submission_text)) > 0
    AND (submission_link_url IS NULL OR TRIM(submission_link_url) = '')
  )
  OR (
    file_url IS NULL
    AND file_name IS NULL
    AND submission_link_url IS NOT NULL
    AND LENGTH(TRIM(submission_link_url)) > 0
    AND (submission_text IS NULL OR TRIM(submission_text) = '')
  )
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-instructions',
  'assignment-instructions',
  false,
  26214400,
  ARRAY['application/pdf'::text]
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Allow image uploads in the assignment-instructions storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-instructions',
  'assignment-instructions',
  false,
  26214400,
  ARRAY[
    'application/pdf'::text,
    'image/jpeg'::text,
    'image/png'::text,
    'image/gif'::text,
    'image/webp'::text
  ]
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = excluded.allowed_mime_types;

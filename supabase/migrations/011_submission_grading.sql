-- Add grading columns to submissions
alter table public.submissions
  add column if not exists grade       smallint   check (grade between 0 and 100),
  add column if not exists feedback    text,
  add column if not exists graded_at   timestamptz,
  add column if not exists graded_by   uuid references public.profiles(id);

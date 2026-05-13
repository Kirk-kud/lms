-- ============================================================
-- Seed data for Vine LMS
-- Run this AFTER 001_initial_schema.sql
-- UUIDs are fixed so the seed is idempotent (safe to re-run
-- after truncating tables).
-- ============================================================

-- Fixed UUIDs
-- Tutor
-- kwami:    00000000-0000-0000-0000-000000000001
-- Students
-- ama:      00000000-0000-0000-0000-000000000002
-- kofi:     00000000-0000-0000-0000-000000000003
-- efua:     00000000-0000-0000-0000-000000000004
-- james:    00000000-0000-0000-0000-000000000005
-- Class
-- faith:    00000000-0000-0000-0000-000000000010
-- Modules
-- week1:    00000000-0000-0000-0000-000000000020
-- week2:    00000000-0000-0000-0000-000000000021
-- Module items
-- w1i1:     00000000-0000-0000-0000-000000000030
-- w1i2:     00000000-0000-0000-0000-000000000031
-- w2i1:     00000000-0000-0000-0000-000000000032
-- w2i2:     00000000-0000-0000-0000-000000000033
-- Assignments
-- a1:       00000000-0000-0000-0000-000000000040
-- a2:       00000000-0000-0000-0000-000000000041
-- Attendance sessions
-- s1:       00000000-0000-0000-0000-000000000050
-- s2:       00000000-0000-0000-0000-000000000051
-- s3:       00000000-0000-0000-0000-000000000052

-- ----------------------------------------------------------
-- Profiles
-- NOTE: These rows reference auth.users(id). In a real
-- Supabase project, create the auth users first (via the
-- Dashboard → Authentication → Users → "Add user") and use
-- the UUIDs Supabase assigns.  For local/seed purposes the
-- fixed UUIDs below are inserted directly; adjust them to
-- match real auth user IDs before running against a live
-- project.
-- ----------------------------------------------------------
insert into public.profiles (id, full_name, email, role) values
  ('00000000-0000-0000-0000-000000000001', 'Kwami Asante',  'kwami@loveinc.org',   'tutor'),
  ('00000000-0000-0000-0000-000000000002', 'Ama Mensah',    'ama@loveinc.org',     'student'),
  ('00000000-0000-0000-0000-000000000003', 'Kofi Boateng',  'kofi@loveinc.org',    'student'),
  ('00000000-0000-0000-0000-000000000004', 'Efua Asante',   'efua@loveinc.org',    'student'),
  ('00000000-0000-0000-0000-000000000005', 'James Yaw',     'james@loveinc.org',   'student')
on conflict (id) do nothing;

-- ----------------------------------------------------------
-- Class
-- ----------------------------------------------------------
insert into public.classes (id, tutor_id, title, description, invite_code) values
  (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'Faith & Life',
    'A discipleship class exploring faith in everyday life.',
    'FAITHLIF'
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------
-- Enrollments (all 4 students)
-- ----------------------------------------------------------
insert into public.enrollments (student_id, class_id) values
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000010')
on conflict (student_id, class_id) do nothing;

-- ----------------------------------------------------------
-- Modules
-- ----------------------------------------------------------
insert into public.modules (id, class_id, title, order_index) values
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 'Week 1: Foundations of Faith', 1),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', 'Week 2: Living It Out',        2)
on conflict (id) do nothing;

-- ----------------------------------------------------------
-- Module items (2 per module)
-- ----------------------------------------------------------
insert into public.module_items (id, module_id, title, type, content_url, content_text, order_index) values
  (
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000020',
    'Introduction to Faith',
    'text',
    null,
    'Faith is the assurance of things hoped for, the conviction of things not seen (Hebrews 11:1). This week we explore what it means to trust God in every area of life.',
    1
  ),
  (
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000020',
    'Week 1 Reading: Hebrews 11',
    'pdf',
    'https://example.com/readings/hebrews-11.pdf',
    null,
    2
  ),
  (
    '00000000-0000-0000-0000-000000000032',
    '00000000-0000-0000-0000-000000000021',
    'Applying Faith Daily',
    'text',
    null,
    'Faith without works is dead (James 2:17). This week we look at practical ways to live out our faith in relationships, work, and community.',
    1
  ),
  (
    '00000000-0000-0000-0000-000000000033',
    '00000000-0000-0000-0000-000000000021',
    'Week 2 Discussion Video',
    'video',
    'https://example.com/videos/week2-discussion.mp4',
    null,
    2
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------
-- Assignments (due dates in the past)
-- ----------------------------------------------------------
insert into public.assignments (id, class_id, title, description, week_number, due_date) values
  (
    '00000000-0000-0000-0000-000000000040',
    '00000000-0000-0000-0000-000000000010',
    'Week 1 Reflection',
    'Write a one-page reflection on what faith means to you personally. Use at least one scripture reference.',
    1,
    '2026-04-07 23:59:00+00'
  ),
  (
    '00000000-0000-0000-0000-000000000041',
    '00000000-0000-0000-0000-000000000010',
    'Week 2 Application Journal',
    'Document three specific ways you applied your faith this week. Include challenges you faced and how you responded.',
    2,
    '2026-04-14 23:59:00+00'
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------
-- Submissions (Ama and Kofi only, both assignments)
-- ----------------------------------------------------------
insert into public.submissions (assignment_id, student_id, file_url, file_name, status, submitted_at) values
  -- Ama: both on time
  (
    '00000000-0000-0000-0000-000000000040',
    '00000000-0000-0000-0000-000000000002',
    'submissions/00000000-0000-0000-0000-000000000002/week1-reflection-ama.pdf',
    'week1-reflection-ama.pdf',
    'submitted',
    '2026-04-06 18:30:00+00'
  ),
  (
    '00000000-0000-0000-0000-000000000041',
    '00000000-0000-0000-0000-000000000002',
    'submissions/00000000-0000-0000-0000-000000000002/week2-journal-ama.pdf',
    'week2-journal-ama.pdf',
    'submitted',
    '2026-04-13 20:15:00+00'
  ),
  -- Kofi: week 1 on time, week 2 late
  (
    '00000000-0000-0000-0000-000000000040',
    '00000000-0000-0000-0000-000000000003',
    'submissions/00000000-0000-0000-0000-000000000003/week1-reflection-kofi.pdf',
    'week1-reflection-kofi.pdf',
    'submitted',
    '2026-04-07 22:00:00+00'
  ),
  (
    '00000000-0000-0000-0000-000000000041',
    '00000000-0000-0000-0000-000000000003',
    'submissions/00000000-0000-0000-0000-000000000003/week2-journal-kofi.pdf',
    'week2-journal-kofi.pdf',
    'late',
    '2026-04-16 09:45:00+00'
  )
on conflict (assignment_id, student_id) do nothing;

-- ----------------------------------------------------------
-- Attendance sessions (3 past sessions, all inactive)
-- ----------------------------------------------------------
insert into public.attendance_sessions (id, class_id, pin_code, started_at, expires_at, is_active) values
  (
    '00000000-0000-0000-0000-000000000050',
    '00000000-0000-0000-0000-000000000010',
    '4821',
    '2026-04-01 09:00:00+00',
    '2026-04-01 09:15:00+00',
    false
  ),
  (
    '00000000-0000-0000-0000-000000000051',
    '00000000-0000-0000-0000-000000000010',
    '7364',
    '2026-04-08 09:00:00+00',
    '2026-04-08 09:15:00+00',
    false
  ),
  (
    '00000000-0000-0000-0000-000000000052',
    '00000000-0000-0000-0000-000000000010',
    '2957',
    '2026-04-15 09:00:00+00',
    '2026-04-15 09:15:00+00',
    false
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------
-- Attendance records (mix of present/absent per session)
--
-- Session 1 (Apr 1):  Ama ✓  Kofi ✓  Efua ✓  James ✗
-- Session 2 (Apr 8):  Ama ✓  Kofi ✗  Efua ✓  James ✓
-- Session 3 (Apr 15): Ama ✓  Kofi ✓  Efua ✗  James ✗
-- ----------------------------------------------------------
insert into public.attendance_records (session_id, student_id, checked_in_at) values
  -- Session 1
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000002', '2026-04-01 09:03:00+00'),
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000003', '2026-04-01 09:05:00+00'),
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000004', '2026-04-01 09:07:00+00'),
  -- Session 2
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000002', '2026-04-08 09:02:00+00'),
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000004', '2026-04-08 09:04:00+00'),
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000005', '2026-04-08 09:08:00+00'),
  -- Session 3
  ('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000002', '2026-04-15 09:01:00+00'),
  ('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000003', '2026-04-15 09:06:00+00')
on conflict (session_id, student_id) do nothing;

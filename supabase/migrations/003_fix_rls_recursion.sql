-- Fix 42P17: infinite RLS recursion between enrollments and classes.
--
-- Root cause: classes_student_select queries enrollments, and
-- enrollments_tutor queries classes. When PostgREST resolves a join
-- that touches both tables (e.g. classes joined with enrollments(count)),
-- the two policies call each other indefinitely.
--
-- Fix: SECURITY DEFINER helper functions bypass RLS on the table they
-- query, breaking the recursive evaluation cycle. All cross-table
-- membership checks go through these helpers instead of direct queries.

-- ----------------------------------------------------------------
-- Helper: is a given user enrolled in a given class?
-- Runs with elevated privileges (bypasses enrollments RLS).
-- ----------------------------------------------------------------
create or replace function public.is_enrolled(p_class_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.enrollments
    where class_id = p_class_id and student_id = p_user_id
  );
$$;

-- ----------------------------------------------------------------
-- Helper: is a given user the tutor of a given class?
-- Runs with elevated privileges (bypasses classes RLS).
-- ----------------------------------------------------------------
create or replace function public.is_class_tutor(p_class_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.classes
    where id = p_class_id and tutor_id = p_user_id
  );
$$;

-- ----------------------------------------------------------------
-- classes: rewrite student_select to use is_enrolled helper
-- (was: queries enrollments directly → triggered enrollments_tutor
--  → queried classes → triggered classes_student_select → loop)
-- ----------------------------------------------------------------
drop policy if exists "classes_student_select" on public.classes;
create policy "classes_student_select" on public.classes for select using (
  public.is_enrolled(id, auth.uid())
);

-- ----------------------------------------------------------------
-- enrollments: rewrite tutor select to use is_class_tutor helper
-- (was: queries classes directly → triggered classes_student_select
--  → queried enrollments → triggered enrollments_tutor → loop)
-- ----------------------------------------------------------------
drop policy if exists "enrollments_tutor" on public.enrollments;
create policy "enrollments_tutor" on public.enrollments for select using (
  public.is_class_tutor(class_id, auth.uid())
);

-- ----------------------------------------------------------------
-- modules: rewrite student select to use is_enrolled helper
-- (was: joined enrollments + classes → latent recursion path)
-- ----------------------------------------------------------------
drop policy if exists "modules_student" on public.modules;
create policy "modules_student" on public.modules for select using (
  public.is_enrolled(class_id, auth.uid())
);

-- ----------------------------------------------------------------
-- module_items: rewrite student select to use is_enrolled via modules
-- (was: joined modules + enrollments → same latent path)
-- ----------------------------------------------------------------
drop policy if exists "module_items_student" on public.module_items;
create policy "module_items_student" on public.module_items for select using (
  exists (
    select 1 from public.modules m
    where m.id = module_id
    and public.is_enrolled(m.class_id, auth.uid())
  )
);

-- ----------------------------------------------------------------
-- assignments: rewrite student select to use is_enrolled helper
-- ----------------------------------------------------------------
drop policy if exists "assignments_student" on public.assignments;
create policy "assignments_student" on public.assignments for select using (
  public.is_enrolled(class_id, auth.uid())
);

-- ----------------------------------------------------------------
-- attendance_sessions: rewrite student select to use is_enrolled helper
-- ----------------------------------------------------------------
drop policy if exists "sessions_student" on public.attendance_sessions;
create policy "sessions_student" on public.attendance_sessions for select using (
  is_active = true
  and public.is_enrolled(class_id, auth.uid())
);

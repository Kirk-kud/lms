-- =============================================================================
-- Row Level Security (RLS) Policies
-- Generated for: public schema (Supabase)
-- 
-- Run this entire script in the Supabase SQL Editor.
-- It drops all existing policies first to avoid conflicts, then recreates them.
--
-- Key roles:
--   service_role  → API backend; bypasses all RLS (full access)
--   authenticated → Logged-in users (tutors & students)
--   anon          → Unauthenticated visitors (invite-code lookup only)
--
-- Helper functions used:
--   is_class_tutor(p_class_id, p_user_id) → true if user owns the class
--   is_enrolled(p_class_id, p_user_id)    → true if user is enrolled
-- =============================================================================


-- =============================================================================
-- TABLE: classes
-- Policies:
--   classes_public_select   → Anyone (anon + authenticated) can SELECT to
--                             support the "join by invite code" flow before
--                             a student is enrolled.
--   classes_tutor_all       → The tutor who owns the class has full access
--                             (SELECT, INSERT, UPDATE, DELETE).
--   classes_service_role    → Service role has unrestricted full access.
-- =============================================================================

DROP POLICY IF EXISTS "classes_public_select"  ON public.classes;
DROP POLICY IF EXISTS "classes_student_select" ON public.classes; -- legacy policy
DROP POLICY IF EXISTS "classes_tutor_all"      ON public.classes;
DROP POLICY IF EXISTS "classes_service_role"   ON public.classes;

-- Allow anyone to read classes (required for invite-code lookup)
CREATE POLICY "classes_public_select"
  ON public.classes
  FOR SELECT
  USING (true);

-- Tutor has full access to their own classes
CREATE POLICY "classes_tutor_all"
  ON public.classes
  USING (auth.uid() = tutor_id);

-- Service role has full unrestricted access
CREATE POLICY "classes_service_role"
  ON public.classes
  USING (auth.role() = 'service_role');


-- =============================================================================
-- TABLE: enrollments
-- Policies:
--   enrollments_student_select → Student sees their own enrollment rows.
--   enrollments_student_insert → Student can enroll themselves (INSERT own
--                                student_id) — enables the invite-code join.
--   enrollments_tutor_select   → Tutor can see all enrollments for their class.
--   enrollments_service_role   → Service role has unrestricted full access.
--
-- Note: Students cannot UPDATE or DELETE enrollments directly; that requires
-- the service role or a dedicated RPC with elevated privileges.
-- =============================================================================

DROP POLICY IF EXISTS "enrollments_student"        ON public.enrollments; -- legacy
DROP POLICY IF EXISTS "enrollments_student_select" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_student_insert" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_tutor"          ON public.enrollments; -- legacy
DROP POLICY IF EXISTS "enrollments_tutor_select"   ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_service_role"   ON public.enrollments;

-- Student can view their own enrollment records
CREATE POLICY "enrollments_student_select"
  ON public.enrollments
  FOR SELECT
  USING (student_id = auth.uid());

-- Student can insert their own enrollment (self-enrol via invite code)
CREATE POLICY "enrollments_student_insert"
  ON public.enrollments
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Tutor can view all enrollments for classes they own
CREATE POLICY "enrollments_tutor_select"
  ON public.enrollments
  FOR SELECT
  USING (is_class_tutor(class_id, auth.uid()));

-- Service role has full unrestricted access
CREATE POLICY "enrollments_service_role"
  ON public.enrollments
  USING (auth.role() = 'service_role');


-- =============================================================================
-- TABLE: modules
-- Policies:
--   modules_student_select  → Enrolled students can view modules.
--   modules_tutor_all       → Tutor has full access to modules in their class.
--   modules_service_role    → Service role has unrestricted full access.
-- =============================================================================

DROP POLICY IF EXISTS "modules_student"        ON public.modules; -- legacy
DROP POLICY IF EXISTS "modules_student_select" ON public.modules;
DROP POLICY IF EXISTS "modules_tutor"          ON public.modules; -- legacy
DROP POLICY IF EXISTS "modules_tutor_all"      ON public.modules;
DROP POLICY IF EXISTS "modules_service_role"   ON public.modules;

-- Enrolled students can read modules for their class
CREATE POLICY "modules_student_select"
  ON public.modules
  FOR SELECT
  USING (is_enrolled(class_id, auth.uid()));

-- Tutor has full access to modules in their own classes
CREATE POLICY "modules_tutor_all"
  ON public.modules
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = modules.class_id
        AND classes.tutor_id = auth.uid()
    )
  );

-- Service role has full unrestricted access
CREATE POLICY "modules_service_role"
  ON public.modules
  USING (auth.role() = 'service_role');


-- =============================================================================
-- TABLE: module_items
-- Policies:
--   module_items_student_select → Enrolled students can view items in modules
--                                 that belong to their enrolled class.
--   module_items_tutor_all      → Tutor has full access to items in their
--                                 class's modules.
--   module_items_service_role   → Service role has unrestricted full access.
-- =============================================================================

DROP POLICY IF EXISTS "module_items_student"        ON public.module_items; -- legacy
DROP POLICY IF EXISTS "module_items_student_select" ON public.module_items;
DROP POLICY IF EXISTS "module_items_tutor"          ON public.module_items; -- legacy
DROP POLICY IF EXISTS "module_items_tutor_all"      ON public.module_items;
DROP POLICY IF EXISTS "module_items_service_role"   ON public.module_items;

-- Enrolled students can read items belonging to their class's modules
CREATE POLICY "module_items_student_select"
  ON public.module_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      WHERE m.id = module_items.module_id
        AND is_enrolled(m.class_id, auth.uid())
    )
  );

-- Tutor has full access to items in modules of their own classes
CREATE POLICY "module_items_tutor_all"
  ON public.module_items
  USING (
    EXISTS (
      SELECT 1
      FROM public.modules m
      JOIN public.classes c ON m.class_id = c.id
      WHERE m.id = module_items.module_id
        AND c.tutor_id = auth.uid()
    )
  );

-- Service role has full unrestricted access
CREATE POLICY "module_items_service_role"
  ON public.module_items
  USING (auth.role() = 'service_role');


-- =============================================================================
-- TABLE: assignments
-- Policies:
--   assignments_student_select → Enrolled students can view assignments.
--   assignments_tutor_all      → Tutor has full access to assignments in their
--                                class.
--   assignments_service_role   → Service role has unrestricted full access.
-- =============================================================================

DROP POLICY IF EXISTS "assignments_student"        ON public.assignments; -- legacy
DROP POLICY IF EXISTS "assignments_student_select" ON public.assignments;
DROP POLICY IF EXISTS "assignments_tutor"          ON public.assignments; -- legacy
DROP POLICY IF EXISTS "assignments_tutor_all"      ON public.assignments;
DROP POLICY IF EXISTS "assignments_service_role"   ON public.assignments;

-- Enrolled students can read assignments for their class
CREATE POLICY "assignments_student_select"
  ON public.assignments
  FOR SELECT
  USING (is_enrolled(class_id, auth.uid()));

-- Tutor has full access to assignments in their own classes
CREATE POLICY "assignments_tutor_all"
  ON public.assignments
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = assignments.class_id
        AND classes.tutor_id = auth.uid()
    )
  );

-- Service role has full unrestricted access
CREATE POLICY "assignments_service_role"
  ON public.assignments
  USING (auth.role() = 'service_role');


-- =============================================================================
-- TABLE: submissions
-- Policies:
--   submissions_student_select → Student can view their own submissions.
--   submissions_student_insert → Student can submit their own work.
--   submissions_tutor_select   → Tutor can view all submissions for
--                                assignments in their class.
--   submissions_service_role   → Service role has unrestricted full access.
--
-- Note: Students cannot UPDATE/DELETE submissions directly. Status changes
-- (e.g. marking late) should go through a service-role RPC or edge function.
-- =============================================================================

DROP POLICY IF EXISTS "submissions_student"        ON public.submissions; -- legacy
DROP POLICY IF EXISTS "submissions_student_select" ON public.submissions;
DROP POLICY IF EXISTS "submissions_student_insert" ON public.submissions;
DROP POLICY IF EXISTS "submissions_tutor"          ON public.submissions; -- legacy
DROP POLICY IF EXISTS "submissions_tutor_select"   ON public.submissions;
DROP POLICY IF EXISTS "submissions_service_role"   ON public.submissions;

-- Student can view their own submissions
CREATE POLICY "submissions_student_select"
  ON public.submissions
  FOR SELECT
  USING (student_id = auth.uid());

-- Student can submit their own work
CREATE POLICY "submissions_student_insert"
  ON public.submissions
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Tutor can view all submissions for assignments in their class
CREATE POLICY "submissions_tutor_select"
  ON public.submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.assignments a
      JOIN public.classes c ON a.class_id = c.id
      WHERE a.id = submissions.assignment_id
        AND c.tutor_id = auth.uid()
    )
  );

-- Service role has full unrestricted access
CREATE POLICY "submissions_service_role"
  ON public.submissions
  USING (auth.role() = 'service_role');


-- =============================================================================
-- TABLE: attendance_sessions
-- Policies:
--   sessions_student_select  → Enrolled students can view active sessions
--                              for their class (needed for PIN check-in).
--   sessions_tutor_all       → Tutor has full access to sessions in their
--                              class (create, start, stop, delete).
--   sessions_service_role    → Service role has unrestricted full access.
-- =============================================================================

DROP POLICY IF EXISTS "sessions_student"        ON public.attendance_sessions; -- legacy
DROP POLICY IF EXISTS "sessions_student_select" ON public.attendance_sessions;
DROP POLICY IF EXISTS "sessions_tutor"          ON public.attendance_sessions; -- legacy
DROP POLICY IF EXISTS "sessions_tutor_all"      ON public.attendance_sessions;
DROP POLICY IF EXISTS "sessions_service_role"   ON public.attendance_sessions;

-- Enrolled students can see active sessions for their class (for PIN check-in)
CREATE POLICY "sessions_student_select"
  ON public.attendance_sessions
  FOR SELECT
  USING (
    is_active = true
    AND is_enrolled(class_id, auth.uid())
  );

-- Tutor has full access to attendance sessions for their own classes
CREATE POLICY "sessions_tutor_all"
  ON public.attendance_sessions
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = attendance_sessions.class_id
        AND classes.tutor_id = auth.uid()
    )
  );

-- Service role has full unrestricted access
CREATE POLICY "sessions_service_role"
  ON public.attendance_sessions
  USING (auth.role() = 'service_role');


-- =============================================================================
-- TABLE: attendance_records
-- Policies:
--   records_student_select  → Student can view their own attendance records.
--   records_student_insert  → Student can insert their own check-in record.
--   records_tutor_select    → Tutor can view all attendance records for
--                             sessions in their class.
--   records_service_role    → Service role has unrestricted full access.
--
-- Note: The unique constraint (session_id, student_id) prevents double
-- check-ins at the DB level, so no additional policy guard is needed.
-- =============================================================================

DROP POLICY IF EXISTS "records_student"        ON public.attendance_records; -- legacy
DROP POLICY IF EXISTS "records_student_select" ON public.attendance_records;
DROP POLICY IF EXISTS "records_student_insert" ON public.attendance_records;
DROP POLICY IF EXISTS "records_tutor"          ON public.attendance_records; -- legacy
DROP POLICY IF EXISTS "records_tutor_select"   ON public.attendance_records;
DROP POLICY IF EXISTS "records_service_role"   ON public.attendance_records;

-- Student can view their own attendance records
CREATE POLICY "records_student_select"
  ON public.attendance_records
  FOR SELECT
  USING (student_id = auth.uid());

-- Student can check themselves in (insert their own record)
CREATE POLICY "records_student_insert"
  ON public.attendance_records
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Tutor can view all attendance records for sessions in their class
CREATE POLICY "records_tutor_select"
  ON public.attendance_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.attendance_sessions s
      JOIN public.classes c ON s.class_id = c.id
      WHERE s.id = attendance_records.session_id
        AND c.tutor_id = auth.uid()
    )
  );

-- Service role has full unrestricted access
CREATE POLICY "records_service_role"
  ON public.attendance_records
  USING (auth.role() = 'service_role');


-- =============================================================================
-- TABLE: profiles
-- Policies:
--   profiles_select  → Anyone (anon + authenticated) can read profiles.
--                      Required for displaying tutor/student info across the
--                      app (e.g. class member lists, submission author names).
--   profiles_insert  → A user can insert their own profile on sign-up, or the
--                      service role can create profiles programmatically.
--   profiles_update  → A user can update their own profile, or the service
--                      role can update any profile.
--
-- Note: DELETE on profiles cascades from auth.users, so no explicit policy
-- is needed for deletion (it is handled by the DB cascade + service role).
-- =============================================================================

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- Anyone can read profile data (names, roles, avatars)
CREATE POLICY "profiles_select"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Users can create their own profile; service role can create any profile
CREATE POLICY "profiles_insert"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR (auth.jwt() ->> 'role') = 'service_role'
    OR auth.uid() IS NULL  -- Service role requests have no user UUID
  );

-- Users can update their own profile; service role can update any profile
CREATE POLICY "profiles_update"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR (auth.jwt() ->> 'role') = 'service_role'
    OR auth.uid() IS NULL  -- Service role requests have no user UUID
  );


-- =============================================================================
-- Ensure RLS is enabled on all tables
-- (Re-enabling is idempotent and safe to run even if already enabled.)
-- =============================================================================

ALTER TABLE public.assignments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions         ENABLE ROW LEVEL SECURITY;
-- Fix common RLS failures seen in signup and module upload flows.
-- Ensures the service role + auth-triggered inserts (no auth.uid())
-- are allowed, and restores tutor write access for modules/module_items
-- including cohort tutors and class tutors.

-- PROBLEM 1: Signups failing with "new row violates row-level security"
-- Reason: some sign-up flows insert profiles from a context without
-- a valid auth.uid() (triggered by the auth system) or with the
-- service role expressed in the JWT. Allow these cases explicitly.

DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;

-- Allow anyone to read profiles (used across the app)
CREATE POLICY profiles_select
  ON public.profiles
  FOR SELECT
  USING (true);

-- Allow profile creation when:
--  - the authenticated user is creating their own profile (auth.uid() = id)
--  - the request is performed with the Supabase service role
-- Also accept service role encoded in JWT for certain deployment setups.
CREATE POLICY profiles_insert
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR auth.role() = 'service_role'
    OR (auth.jwt() ->> 'role') = 'service_role'
  );

-- Allow updates when the user owns the profile or when using service role
CREATE POLICY profiles_update
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR auth.role() = 'service_role'
    OR (auth.jwt() ->> 'role') = 'service_role'
  );


-- PROBLEM 2: Tutors/admins blocked from creating/updating modules
-- Reason: after role/cohort changes the explicit tutor write policies
-- were narrowed to SELECT only in some migrations. Recreate robust
-- policies that permit class tutors, cohort tutors, and admins to
-- perform writes, while still enforcing ownership checks.

-- Modules
DROP POLICY IF EXISTS modules_admin_all ON public.modules;
DROP POLICY IF EXISTS modules_tutor_all ON public.modules;
DROP POLICY IF EXISTS modules_tutor_select ON public.modules;
DROP POLICY IF EXISTS modules_student_select ON public.modules;
DROP POLICY IF EXISTS modules_service_role ON public.modules;

-- Admins who are class tutors may perform any action on modules for that class
CREATE POLICY modules_admin_all
  ON public.modules
  USING (
    public.is_admin(auth.uid())
    AND public.is_class_tutor(class_id, auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    AND public.is_class_tutor(class_id, auth.uid())
    AND (
      cohort_id IS NULL OR EXISTS (
        SELECT 1 FROM public.cohorts c WHERE c.id = cohort_id AND c.class_id = modules.class_id
      )
    )
  );

-- Tutors (cohort tutors or class tutors) may create/update/delete modules
-- if they are either the class tutor or the cohort tutor for the target cohort.
CREATE POLICY modules_tutor_all
  ON public.modules
  FOR ALL
  USING (
    public.is_class_tutor(class_id, auth.uid())
    OR (
      cohort_id IS NOT NULL AND public.is_cohort_tutor(cohort_id, auth.uid())
    )
  )
  WITH CHECK (
    public.is_class_tutor(class_id, auth.uid())
    OR (
      cohort_id IS NOT NULL AND public.is_cohort_tutor(cohort_id, auth.uid())
    )
  );

-- Students can SELECT modules for classes they're enrolled in (cohort-aware)
CREATE POLICY modules_student_select
  ON public.modules
  FOR SELECT
  USING (
    public.is_enrolled(class_id, auth.uid())
    AND (
      cohort_id IS NULL OR EXISTS (
        SELECT 1 FROM public.enrollments e WHERE e.class_id = modules.class_id AND e.student_id = auth.uid() AND e.cohort_id = modules.cohort_id
      )
    )
  );

-- Service role: full access
CREATE POLICY modules_service_role
  ON public.modules
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- Module items
DROP POLICY IF EXISTS module_items_admin_all ON public.module_items;
DROP POLICY IF EXISTS module_items_tutor_all ON public.module_items;
DROP POLICY IF EXISTS module_items_tutor_select ON public.module_items;
DROP POLICY IF EXISTS module_items_student_select ON public.module_items;
DROP POLICY IF EXISTS module_items_service_role ON public.module_items;

CREATE POLICY module_items_admin_all
  ON public.module_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m WHERE m.id = module_items.module_id
      AND public.is_admin(auth.uid()) AND public.is_class_tutor(m.class_id, auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.modules m WHERE m.id = module_items.module_id
      AND public.is_admin(auth.uid()) AND public.is_class_tutor(m.class_id, auth.uid())
    )
  );

CREATE POLICY module_items_tutor_all
  ON public.module_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m WHERE m.id = module_items.module_id
      AND (
        public.is_class_tutor(m.class_id, auth.uid())
        OR (m.cohort_id IS NOT NULL AND public.is_cohort_tutor(m.cohort_id, auth.uid()))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.modules m WHERE m.id = module_items.module_id
      AND (
        public.is_class_tutor(m.class_id, auth.uid())
        OR (m.cohort_id IS NOT NULL AND public.is_cohort_tutor(m.cohort_id, auth.uid()))
      )
    )
  );

CREATE POLICY module_items_student_select
  ON public.module_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m WHERE m.id = module_items.module_id
      AND public.is_enrolled(m.class_id, auth.uid())
      AND (
        m.cohort_id IS NULL OR EXISTS (
          SELECT 1 FROM public.enrollments e WHERE e.class_id = m.class_id AND e.student_id = auth.uid() AND e.cohort_id = m.cohort_id
        )
      )
    )
  );

CREATE POLICY module_items_service_role
  ON public.module_items
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Ensure RLS is enabled for the modified tables (idempotent)
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_items        ENABLE ROW LEVEL SECURITY;

-- End migration
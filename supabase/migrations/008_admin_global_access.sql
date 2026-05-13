-- Admins are platform operators, not just class owners.
-- These policies remove the remaining tutor_id ownership limits for the admin role.

DROP POLICY IF EXISTS "classes_tutor_all" ON public.classes;
DROP POLICY IF EXISTS "classes_admin_all" ON public.classes;
CREATE POLICY "classes_admin_all"
  ON public.classes
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "cohorts_admin_all" ON public.cohorts;
CREATE POLICY "cohorts_admin_all"
  ON public.cohorts
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "ta_invites_admin_insert" ON public.ta_invites;
DROP POLICY IF EXISTS "ta_invites_admin_select" ON public.ta_invites;
CREATE POLICY "ta_invites_admin_select"
  ON public.ta_invites
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "ta_invites_admin_insert"
  ON public.ta_invites
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()) AND created_by = auth.uid());

DROP POLICY IF EXISTS "enrollments_admin_all" ON public.enrollments;
CREATE POLICY "enrollments_admin_all"
  ON public.enrollments
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "assignments_admin_all" ON public.assignments;
CREATE POLICY "assignments_admin_all"
  ON public.assignments
  USING (public.is_admin(auth.uid()))
  WITH CHECK (
    public.is_admin(auth.uid())
    AND (
      cohort_id IS NULL OR EXISTS (
        SELECT 1
        FROM public.cohorts c
        WHERE c.id = cohort_id
          AND c.class_id = assignments.class_id
      )
    )
  );

DROP POLICY IF EXISTS "modules_admin_all" ON public.modules;
CREATE POLICY "modules_admin_all"
  ON public.modules
  USING (public.is_admin(auth.uid()))
  WITH CHECK (
    public.is_admin(auth.uid())
    AND (
      cohort_id IS NULL OR EXISTS (
        SELECT 1
        FROM public.cohorts c
        WHERE c.id = cohort_id
          AND c.class_id = modules.class_id
      )
    )
  );

DROP POLICY IF EXISTS "module_items_admin_all" ON public.module_items;
CREATE POLICY "module_items_admin_all"
  ON public.module_items
  USING (
    public.is_admin(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.modules m
      WHERE m.id = module_items.module_id
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.modules m
      WHERE m.id = module_items.module_id
    )
  );

DROP POLICY IF EXISTS "submissions_admin_all" ON public.submissions;
CREATE POLICY "submissions_admin_all"
  ON public.submissions
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "sessions_admin_all" ON public.attendance_sessions;
CREATE POLICY "sessions_admin_all"
  ON public.attendance_sessions
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "records_admin_all" ON public.attendance_records;
CREATE POLICY "records_admin_all"
  ON public.attendance_records
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

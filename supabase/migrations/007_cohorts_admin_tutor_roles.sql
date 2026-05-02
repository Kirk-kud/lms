-- Cohorts and role rename:
--   old tutor role -> admin
--   teaching assistant behavior -> tutor role

-- Update public profile role values and constraint.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

UPDATE public.profiles
SET role = 'admin'
WHERE role = 'tutor';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'tutor', 'student'));

-- Keep Supabase Auth metadata in sync for existing users.
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb,
  true
)
WHERE raw_user_meta_data->>'role' = 'tutor';

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS zoom_link text;

CREATE TABLE IF NOT EXISTS public.cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  ta_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  zoom_link text,
  invite_pin text UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ta_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  email text,
  cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL,
  used boolean DEFAULT false,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL;

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL;

ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS cohorts_class_id_idx ON public.cohorts(class_id);
CREATE INDEX IF NOT EXISTS cohorts_ta_id_idx ON public.cohorts(ta_id);
CREATE INDEX IF NOT EXISTS enrollments_cohort_id_idx ON public.enrollments(cohort_id);
CREATE INDEX IF NOT EXISTS assignments_cohort_id_idx ON public.assignments(cohort_id);
CREATE INDEX IF NOT EXISTS modules_cohort_id_idx ON public.modules(cohort_id);

ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ta_invites ENABLE ROW LEVEL SECURITY;

-- Helper functions avoid recursive RLS checks and encode the new role names.
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_cohort_tutor(p_cohort_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cohorts
    WHERE id = p_cohort_id AND ta_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_class_tutor(p_class_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = p_class_id AND tutor_id = p_user_id
  );
$$;

-- Cohorts: admins manage cohorts in their classes; tutors and students can read their own cohorts.
DROP POLICY IF EXISTS "cohorts_admin_all" ON public.cohorts;
DROP POLICY IF EXISTS "cohorts_tutor_select" ON public.cohorts;
DROP POLICY IF EXISTS "cohorts_student_select" ON public.cohorts;
DROP POLICY IF EXISTS "cohorts_service_role" ON public.cohorts;

CREATE POLICY "cohorts_admin_all"
  ON public.cohorts
  USING (public.is_admin(auth.uid()) AND public.is_class_tutor(class_id, auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) AND public.is_class_tutor(class_id, auth.uid()));

CREATE POLICY "cohorts_tutor_select"
  ON public.cohorts
  FOR SELECT
  USING (ta_id = auth.uid());

CREATE POLICY "cohorts_student_select"
  ON public.cohorts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.cohort_id = cohorts.id AND e.student_id = auth.uid()
    )
  );

CREATE POLICY "cohorts_service_role"
  ON public.cohorts
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- TA invites: admins manage; public lookup supports invite redemption by code.
DROP POLICY IF EXISTS "ta_invites_public_select" ON public.ta_invites;
DROP POLICY IF EXISTS "ta_invites_admin_select" ON public.ta_invites;
DROP POLICY IF EXISTS "ta_invites_admin_insert" ON public.ta_invites;
DROP POLICY IF EXISTS "ta_invites_service_role" ON public.ta_invites;

CREATE POLICY "ta_invites_public_select"
  ON public.ta_invites
  FOR SELECT
  USING (true);

CREATE POLICY "ta_invites_admin_insert"
  ON public.ta_invites
  FOR INSERT
  WITH CHECK (
    public.is_admin(auth.uid())
    AND created_by = auth.uid()
    AND (
      cohort_id IS NULL OR EXISTS (
        SELECT 1
        FROM public.cohorts c
        WHERE c.id = cohort_id
          AND public.is_class_tutor(c.class_id, auth.uid())
      )
    )
  );

CREATE POLICY "ta_invites_service_role"
  ON public.ta_invites
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Enrollments: preserve existing student/admin policies and add tutor cohort access.
DROP POLICY IF EXISTS "enrollments_tutor_cohort_select" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_tutor_cohort_insert" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_tutor_cohort_delete" ON public.enrollments;

CREATE POLICY "enrollments_tutor_cohort_select"
  ON public.enrollments
  FOR SELECT
  USING (cohort_id IS NOT NULL AND public.is_cohort_tutor(cohort_id, auth.uid()));

CREATE POLICY "enrollments_tutor_cohort_insert"
  ON public.enrollments
  FOR INSERT
  WITH CHECK (
    cohort_id IS NOT NULL
    AND public.is_cohort_tutor(cohort_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.cohorts c
      WHERE c.id = cohort_id AND c.class_id = enrollments.class_id
    )
  );

CREATE POLICY "enrollments_tutor_cohort_delete"
  ON public.enrollments
  FOR DELETE
  USING (cohort_id IS NOT NULL AND public.is_cohort_tutor(cohort_id, auth.uid()));

-- Assignments: admins manage; tutors/students read class-wide plus their cohort-specific records.
DROP POLICY IF EXISTS "assignments_student" ON public.assignments;
DROP POLICY IF EXISTS "assignments_student_select" ON public.assignments;
DROP POLICY IF EXISTS "assignments_tutor" ON public.assignments;
DROP POLICY IF EXISTS "assignments_tutor_all" ON public.assignments;
DROP POLICY IF EXISTS "assignments_admin_all" ON public.assignments;
DROP POLICY IF EXISTS "assignments_tutor_select" ON public.assignments;
DROP POLICY IF EXISTS "assignments_service_role" ON public.assignments;

CREATE POLICY "assignments_admin_all"
  ON public.assignments
  USING (public.is_admin(auth.uid()) AND public.is_class_tutor(class_id, auth.uid()))
  WITH CHECK (
    public.is_admin(auth.uid())
    AND public.is_class_tutor(class_id, auth.uid())
    AND (
      cohort_id IS NULL OR EXISTS (
        SELECT 1 FROM public.cohorts c
        WHERE c.id = cohort_id AND c.class_id = assignments.class_id
      )
    )
  );

CREATE POLICY "assignments_tutor_select"
  ON public.assignments
  FOR SELECT
  USING (
    cohort_id IS NULL
    OR public.is_cohort_tutor(cohort_id, auth.uid())
  );

CREATE POLICY "assignments_student_select"
  ON public.assignments
  FOR SELECT
  USING (
    public.is_enrolled(class_id, auth.uid())
    AND (
      cohort_id IS NULL OR EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.class_id = assignments.class_id
          AND e.student_id = auth.uid()
          AND e.cohort_id = assignments.cohort_id
      )
    )
  );

CREATE POLICY "assignments_service_role"
  ON public.assignments
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Modules: same visibility as assignments.
DROP POLICY IF EXISTS "modules_student" ON public.modules;
DROP POLICY IF EXISTS "modules_student_select" ON public.modules;
DROP POLICY IF EXISTS "modules_tutor" ON public.modules;
DROP POLICY IF EXISTS "modules_tutor_all" ON public.modules;
DROP POLICY IF EXISTS "modules_admin_all" ON public.modules;
DROP POLICY IF EXISTS "modules_tutor_select" ON public.modules;
DROP POLICY IF EXISTS "modules_service_role" ON public.modules;

CREATE POLICY "modules_admin_all"
  ON public.modules
  USING (public.is_admin(auth.uid()) AND public.is_class_tutor(class_id, auth.uid()))
  WITH CHECK (
    public.is_admin(auth.uid())
    AND public.is_class_tutor(class_id, auth.uid())
    AND (
      cohort_id IS NULL OR EXISTS (
        SELECT 1 FROM public.cohorts c
        WHERE c.id = cohort_id AND c.class_id = modules.class_id
      )
    )
  );

CREATE POLICY "modules_tutor_select"
  ON public.modules
  FOR SELECT
  USING (
    cohort_id IS NULL
    OR public.is_cohort_tutor(cohort_id, auth.uid())
  );

CREATE POLICY "modules_student_select"
  ON public.modules
  FOR SELECT
  USING (
    public.is_enrolled(class_id, auth.uid())
    AND (
      cohort_id IS NULL OR EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.class_id = modules.class_id
          AND e.student_id = auth.uid()
          AND e.cohort_id = modules.cohort_id
      )
    )
  );

CREATE POLICY "modules_service_role"
  ON public.modules
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "module_items_student" ON public.module_items;
DROP POLICY IF EXISTS "module_items_student_select" ON public.module_items;
DROP POLICY IF EXISTS "module_items_tutor" ON public.module_items;
DROP POLICY IF EXISTS "module_items_tutor_all" ON public.module_items;
DROP POLICY IF EXISTS "module_items_admin_all" ON public.module_items;
DROP POLICY IF EXISTS "module_items_tutor_select" ON public.module_items;
DROP POLICY IF EXISTS "module_items_service_role" ON public.module_items;

CREATE POLICY "module_items_admin_all"
  ON public.module_items
  USING (
    EXISTS (
      SELECT 1
      FROM public.modules m
      WHERE m.id = module_items.module_id
        AND public.is_admin(auth.uid())
        AND public.is_class_tutor(m.class_id, auth.uid())
    )
  );

CREATE POLICY "module_items_tutor_select"
  ON public.module_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.modules m
      WHERE m.id = module_items.module_id
        AND (m.cohort_id IS NULL OR public.is_cohort_tutor(m.cohort_id, auth.uid()))
    )
  );

CREATE POLICY "module_items_student_select"
  ON public.module_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.modules m
      WHERE m.id = module_items.module_id
        AND public.is_enrolled(m.class_id, auth.uid())
        AND (
          m.cohort_id IS NULL OR EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.class_id = m.class_id
              AND e.student_id = auth.uid()
              AND e.cohort_id = m.cohort_id
          )
        )
    )
  );

CREATE POLICY "module_items_service_role"
  ON public.module_items
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


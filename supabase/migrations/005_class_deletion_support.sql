-- =============================================================================
-- Migration: Class deletion support
--
-- Allows a class row to be deleted while retaining enrollment records for audit.
-- The enrollments.class_id FK is changed from RESTRICT (default) to SET NULL,
-- and the column is made nullable so the row survives the parent deletion.
--
-- FK cascades that already exist (no changes needed):
--   assignments.class_id       → ON DELETE CASCADE
--   modules.class_id           → ON DELETE CASCADE
--   attendance_sessions.class_id → ON DELETE CASCADE
--   module_items.module_id     → ON DELETE CASCADE  (via modules)
--   submissions.assignment_id  → ON DELETE CASCADE  (via assignments)
--   attendance_records.session_id → ON DELETE CASCADE (via sessions)
-- =============================================================================

-- Make class_id nullable so enrollment rows can outlive their class
ALTER TABLE public.enrollments
  ALTER COLUMN class_id DROP NOT NULL;

-- Replace the existing FK with one that nullifies class_id on class deletion
ALTER TABLE public.enrollments
  DROP CONSTRAINT enrollments_class_id_fkey;

ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_class_id_fkey
  FOREIGN KEY (class_id)
  REFERENCES public.classes(id)
  ON DELETE SET NULL;

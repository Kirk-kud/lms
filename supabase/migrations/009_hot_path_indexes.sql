-- Hot-path indexes for dashboard, roster, attendance, and content queries.
-- Existing unique constraints cover direct lookups like (student_id, class_id)
-- and (assignment_id, student_id), but many LMS pages filter by class or parent id.

CREATE INDEX IF NOT EXISTS classes_tutor_id_idx
  ON public.classes(tutor_id);

CREATE INDEX IF NOT EXISTS enrollments_class_id_idx
  ON public.enrollments(class_id);

CREATE INDEX IF NOT EXISTS assignments_class_due_date_idx
  ON public.assignments(class_id, due_date);

CREATE INDEX IF NOT EXISTS assignments_class_week_number_idx
  ON public.assignments(class_id, week_number);

CREATE INDEX IF NOT EXISTS modules_class_order_idx
  ON public.modules(class_id, order_index);

CREATE INDEX IF NOT EXISTS module_items_module_order_idx
  ON public.module_items(module_id, order_index);

CREATE INDEX IF NOT EXISTS submissions_assignment_id_idx
  ON public.submissions(assignment_id);

CREATE INDEX IF NOT EXISTS attendance_sessions_class_started_idx
  ON public.attendance_sessions(class_id, started_at DESC);

CREATE INDEX IF NOT EXISTS attendance_sessions_active_lookup_idx
  ON public.attendance_sessions(class_id, is_active, expires_at);

CREATE INDEX IF NOT EXISTS attendance_records_student_session_idx
  ON public.attendance_records(student_id, session_id);

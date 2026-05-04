-- ============================================================
-- announcements
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id    uuid        NOT NULL REFERENCES classes(id)   ON DELETE CASCADE,
  author_id   uuid        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  title       text        NOT NULL,
  body        text        NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Students enrolled in the class can read announcements
CREATE POLICY "students_read_announcements" ON announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.class_id = announcements.class_id
        AND enrollments.student_id = auth.uid()
    )
  );

-- Tutors who own the class can do everything
CREATE POLICY "tutors_manage_announcements" ON announcements
  FOR ALL USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = announcements.class_id
        AND classes.tutor_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS announcements_class_id_idx
  ON announcements(class_id, created_at DESC);

-- ============================================================
-- notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text        NOT NULL, -- 'new_assignment' | 'new_announcement'
  title       text        NOT NULL,
  body        text,
  data        jsonb       DEFAULT '{}',
  read        boolean     DEFAULT false NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS notifications_user_id_idx
  ON notifications(user_id, created_at DESC);

-- ============================================================
-- Trigger: notify enrolled students when an assignment is created
-- ============================================================
CREATE OR REPLACE FUNCTION notify_students_new_assignment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT
    e.student_id,
    'new_assignment',
    'New assignment: ' || NEW.title,
    'Due ' || to_char(NEW.due_date::date, 'Mon DD, YYYY'),
    jsonb_build_object(
      'class_id',      NEW.class_id,
      'assignment_id', NEW.id,
      'due_date',      NEW.due_date
    )
  FROM enrollments e
  WHERE e.class_id = NEW.class_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_assignment_created ON assignments;
CREATE TRIGGER on_assignment_created
  AFTER INSERT ON assignments
  FOR EACH ROW EXECUTE FUNCTION notify_students_new_assignment();

-- ============================================================
-- Trigger: notify enrolled students when an announcement is posted
-- ============================================================
CREATE OR REPLACE FUNCTION notify_students_new_announcement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT
    e.student_id,
    'new_announcement',
    NEW.title,
    left(NEW.body, 120),
    jsonb_build_object(
      'class_id',        NEW.class_id,
      'announcement_id', NEW.id
    )
  FROM enrollments e
  WHERE e.class_id = NEW.class_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_announcement_created ON announcements;
CREATE TRIGGER on_announcement_created
  AFTER INSERT ON announcements
  FOR EACH ROW EXECUTE FUNCTION notify_students_new_announcement();

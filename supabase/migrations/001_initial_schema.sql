-- Users (mirrors Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('tutor', 'student')),
  avatar_initials text generated always as (
    upper(left(full_name, 1)) ||
    upper(left(split_part(full_name, ' ', 2), 1))
  ) stored,
  created_at timestamptz default now()
);

-- Classes
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id),
  title text not null,
  description text,
  invite_code text unique not null default upper(substr(md5(random()::text), 1, 8)),
  created_at timestamptz default now()
);

-- Enrollments
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id),
  class_id uuid not null references public.classes(id),
  enrolled_at timestamptz default now(),
  unique(student_id, class_id)
);

-- Modules
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  order_index integer not null default 0,
  created_at timestamptz default now()
);

-- Module items
create table public.module_items (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  type text not null check (type in ('pdf', 'video', 'link', 'text')),
  content_url text,
  content_text text,
  order_index integer not null default 0,
  created_at timestamptz default now()
);

-- Assignments
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  description text,
  week_number integer not null,
  due_date timestamptz not null,
  created_at timestamptz default now()
);

-- Submissions
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id),
  file_url text not null,
  file_name text not null,
  status text not null default 'submitted' check (status in ('submitted', 'late')),
  submitted_at timestamptz default now(),
  unique(assignment_id, student_id)
);

-- Attendance sessions
create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  pin_code text not null,
  started_at timestamptz default now(),
  expires_at timestamptz not null,
  is_active boolean default true
);

-- Attendance records
create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id),
  checked_in_at timestamptz default now(),
  unique(session_id, student_id)
);

-- Profiles: users can read all profiles, only update their own
alter table public.profiles enable row level security;
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles
  for insert
  with check (auth.uid() = id or auth.role() = 'service_role');
create policy "profiles_update" on public.profiles
  for update
  using (auth.uid() = id or auth.role() = 'service_role');

-- Classes: tutors manage their own, students can read enrolled classes
alter table public.classes enable row level security;
create policy "classes_tutor_all" on public.classes for all using (auth.uid() = tutor_id);
create policy "classes_student_select" on public.classes for select using (
  exists (select 1 from public.enrollments where class_id = id and student_id = auth.uid())
);

-- Enrollments: students see own, tutors see their class enrollments
alter table public.enrollments enable row level security;
create policy "enrollments_student" on public.enrollments for all using (student_id = auth.uid());
create policy "enrollments_tutor" on public.enrollments for select using (
  exists (select 1 from public.classes where id = class_id and tutor_id = auth.uid())
);

-- Modules & items: enrolled students read, tutors write
alter table public.modules enable row level security;
create policy "modules_tutor" on public.modules for all using (
  exists (select 1 from public.classes where id = class_id and tutor_id = auth.uid())
);
create policy "modules_student" on public.modules for select using (
  exists (select 1 from public.enrollments e join public.classes c on e.class_id = c.id where c.id = class_id and e.student_id = auth.uid())
);

alter table public.module_items enable row level security;
create policy "module_items_tutor" on public.module_items for all using (
  exists (select 1 from public.modules m join public.classes c on m.class_id = c.id where m.id = module_id and c.tutor_id = auth.uid())
);
create policy "module_items_student" on public.module_items for select using (
  exists (select 1 from public.modules m join public.enrollments e on m.class_id = e.class_id where m.id = module_id and e.student_id = auth.uid())
);

-- Assignments: same pattern
alter table public.assignments enable row level security;
create policy "assignments_tutor" on public.assignments for all using (
  exists (select 1 from public.classes where id = class_id and tutor_id = auth.uid())
);
create policy "assignments_student" on public.assignments for select using (
  exists (select 1 from public.enrollments where class_id = assignments.class_id and student_id = auth.uid())
);

-- Submissions: students manage own, tutors can read
alter table public.submissions enable row level security;
create policy "submissions_student" on public.submissions for all using (student_id = auth.uid());
create policy "submissions_tutor" on public.submissions for select using (
  exists (select 1 from public.assignments a join public.classes c on a.class_id = c.id where a.id = assignment_id and c.tutor_id = auth.uid())
);

-- Attendance sessions: tutors manage, enrolled students can read active ones
alter table public.attendance_sessions enable row level security;
create policy "sessions_tutor" on public.attendance_sessions for all using (
  exists (select 1 from public.classes where id = class_id and tutor_id = auth.uid())
);
create policy "sessions_student" on public.attendance_sessions for select using (
  is_active = true and
  exists (select 1 from public.enrollments where class_id = attendance_sessions.class_id and student_id = auth.uid())
);

-- Attendance records: students insert/read own, tutors read their class records
alter table public.attendance_records enable row level security;
create policy "records_student" on public.attendance_records for all using (student_id = auth.uid());
create policy "records_tutor" on public.attendance_records for select using (
  exists (select 1 from public.attendance_sessions s join public.classes c on s.class_id = c.id where s.id = session_id and c.tutor_id = auth.uid())
);

insert into storage.buckets (id, name, public) values ('submissions', 'submissions', false);
create policy "students_upload" on storage.objects for insert with check (
  bucket_id = 'submissions' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "students_read_own" on storage.objects for select using (
  bucket_id = 'submissions' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "tutors_read_submissions" on storage.objects for select using (
  bucket_id = 'submissions'
);

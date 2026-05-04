import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateClassDto, JoinClassDto } from './classes.dto';

interface QueryError {
  message: string;
}

interface QueryResult<T> {
  data: T[] | null;
  error: QueryError | null;
  count?: number | null;
}

interface SingleQueryResult<T> {
  data: T | null;
  error: QueryError | null;
  count?: number | null;
}

export interface ClassRecord {
  id: string;
  tutor_id: string;
  title: string;
  description: string | null;
  invite_code: string;
  zoom_link?: string | null;
  created_at: string;
  tutor?: unknown;
}

interface ClassIdRow {
  class_id: string | null;
}

interface CohortClassRow {
  class: ClassRecord | ClassRecord[] | null;
  cohort_id: string | null;
  cohort_name: string | null;
}

interface StudentEnrollmentClassRow {
  enrolled_at: string;
  cohort_id: string | null;
  class: ClassRecord | ClassRecord[] | null;
}

interface IdRow {
  id: string;
}

export interface JoinClassRecord {
  id: string;
  tutor_id: string;
  invite_code: string;
  [key: string]: unknown;
}

interface CohortRecord {
  id: string;
  class_id: string;
}

interface RosterEnrollmentRow {
  enrolled_at: string;
  student: StudentProfile | StudentProfile[] | null;
}

export interface StudentProfile {
  id: string;
  [key: string]: unknown;
}

interface AttendanceRecordRow {
  student_id: string;
}

function asQueryResult<T>(value: unknown): QueryResult<T> {
  return value as QueryResult<T>;
}

function asSingleQueryResult<T>(value: unknown): SingleQueryResult<T> {
  return value as SingleQueryResult<T>;
}

function unwrapRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(private readonly supabase: SupabaseService) {}

  // ----------------------------------------------------------------
  // POST /classes
  // ----------------------------------------------------------------
  async create(adminId: string, dto: CreateClassDto) {
    const invite_code = this.generateInviteCode();

    const result = asSingleQueryResult<ClassRecord>(
      await this.supabase.adminClient
        .from('classes')
        .insert({
          tutor_id: adminId,
          title: dto.title,
          description: dto.description ?? null,
          zoom_link: dto.zoom_link ?? null,
          invite_code,
        })
        .select()
        .single(),
    );
    const { data, error } = result;

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new BadRequestException('Class was not created');
    return data;
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  // ----------------------------------------------------------------
  // GET /classes
  // ----------------------------------------------------------------
  async findAll(userId: string, role: string | null) {
    if (role === 'admin') {
      const [rawClassResult, rawEnrollResult, rawCohortResult] =
        await Promise.all([
          this.supabase.adminClient
            .from('classes')
            .select(
              'id, tutor_id, title, description, invite_code, zoom_link, created_at, tutor:profiles!tutor_id(full_name, email)',
            )
            .order('created_at', { ascending: false }),
          this.supabase.adminClient.from('enrollments').select('class_id'),
          this.supabase.adminClient.from('cohorts').select('class_id'),
        ]);

      const classResult = asQueryResult<ClassRecord>(rawClassResult);
      const enrollResult = asQueryResult<ClassIdRow>(rawEnrollResult);
      const cohortResult = asQueryResult<ClassIdRow>(rawCohortResult);

      if (classResult.error)
        throw new BadRequestException(classResult.error.message);
      if (enrollResult.error)
        throw new BadRequestException(enrollResult.error.message);
      if (cohortResult.error)
        throw new BadRequestException(cohortResult.error.message);

      const enrollCountByClass = new Map<string, number>();
      for (const row of enrollResult.data ?? []) {
        if (!row.class_id) continue;
        enrollCountByClass.set(
          row.class_id,
          (enrollCountByClass.get(row.class_id) ?? 0) + 1,
        );
      }
      const cohortCountByClass = new Map<string, number>();
      for (const row of cohortResult.data ?? []) {
        if (!row.class_id) continue;
        cohortCountByClass.set(
          row.class_id,
          (cohortCountByClass.get(row.class_id) ?? 0) + 1,
        );
      }

      return (classResult.data ?? []).map((cls) => ({
        ...cls,
        enrolled_count: enrollCountByClass.get(cls.id) ?? 0,
        cohort_count: cohortCountByClass.get(cls.id) ?? 0,
      }));
    }

    if (role === 'tutor') {
      const { data, error } = asQueryResult<CohortClassRow>(
        await this.supabase.adminClient
          .from('cohorts')
          .select(
            'class:classes(id, tutor_id, title, description, invite_code, zoom_link, created_at), cohort_id:id, cohort_name:name',
          )
          .eq('ta_id', userId)
          .order('created_at', { ascending: false }),
      );

      if (error) throw new BadRequestException(error.message);

      const classIds = (data ?? [])
        .map((row) => unwrapRelation(row.class)?.id)
        .filter((id): id is string => Boolean(id));

      const enrollResult = asQueryResult<ClassIdRow>(
        await this.supabase.adminClient
          .from('enrollments')
          .select('class_id')
          .in('class_id', classIds),
      );
      if (enrollResult.error)
        throw new BadRequestException(enrollResult.error.message);

      const enrollCountByClass = new Map<string, number>();
      for (const row of enrollResult.data ?? []) {
        if (!row.class_id) continue;
        enrollCountByClass.set(
          row.class_id,
          (enrollCountByClass.get(row.class_id) ?? 0) + 1,
        );
      }

      return (data ?? []).map((row) => {
        const cls = unwrapRelation(row.class);
        return {
          ...cls,
          enrolled_count: cls ? (enrollCountByClass.get(cls.id) ?? 0) : 0,
          cohort_count: 0,
          cohort_id: row.cohort_id,
          cohort_name: row.cohort_name,
        };
      });
    }

    // student
    const { data, error } = asQueryResult<StudentEnrollmentClassRow>(
      await this.supabase.adminClient
        .from('enrollments')
        .select(
          'enrolled_at, cohort_id, class:classes(id, tutor_id, title, description, invite_code, zoom_link, created_at)',
        )
        .eq('student_id', userId)
        .order('enrolled_at', { ascending: false }),
    );

    if (error) throw new BadRequestException(error.message);

    const classIds = (data ?? [])
      .map((row) => unwrapRelation(row.class)?.id)
      .filter((id): id is string => Boolean(id));

    const enrollResult = asQueryResult<ClassIdRow>(
      await this.supabase.adminClient
        .from('enrollments')
        .select('class_id')
        .in('class_id', classIds),
    );
    if (enrollResult.error)
      throw new BadRequestException(enrollResult.error.message);

    const enrollCountByClass = new Map<string, number>();
    for (const row of enrollResult.data ?? []) {
      if (!row.class_id) continue;
      enrollCountByClass.set(
        row.class_id,
        (enrollCountByClass.get(row.class_id) ?? 0) + 1,
      );
    }

    return (data ?? []).map((row) => {
      const cls = unwrapRelation(row.class);
      return {
        ...cls,
        enrolled_count: cls ? (enrollCountByClass.get(cls.id) ?? 0) : 0,
        cohort_count: 0,
        enrolled_at: row.enrolled_at,
        cohort_id: row.cohort_id,
      };
    });
  }

  // ----------------------------------------------------------------
  // GET /classes/:id
  // ----------------------------------------------------------------
  async findOne(classId: string, userId: string, role: string | null) {
    const [rawClsResult, rawEnrollResult] = await Promise.all([
      this.supabase.adminClient
        .from('classes')
        .select(
          'id, tutor_id, title, description, invite_code, zoom_link, created_at, tutor:profiles!tutor_id(id, full_name, email, role, avatar_initials, created_at)',
        )
        .eq('id', classId)
        .single(),
      this.supabase.adminClient
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', classId),
    ]);
    const clsResult = asSingleQueryResult<ClassRecord>(rawClsResult);
    const enrollResult = asQueryResult<IdRow>(rawEnrollResult);

    if (clsResult.error || !clsResult.data)
      throw new NotFoundException('Class not found');
    if (enrollResult.error)
      throw new BadRequestException(enrollResult.error.message);
    const cls = clsResult.data;

    if (role === 'admin') {
      // Admin can access any class
    } else if (role === 'tutor') {
      const { data: cohort } = await this.supabase.adminClient
        .from('cohorts')
        .select('id')
        .eq('class_id', classId)
        .eq('ta_id', userId)
        .maybeSingle();

      if (!cohort)
        throw new ForbiddenException('No cohort assigned for this class');
    } else {
      const { data: enrollment } = await this.supabase.adminClient
        .from('enrollments')
        .select('id')
        .eq('class_id', classId)
        .eq('student_id', userId)
        .maybeSingle();

      if (!enrollment)
        throw new ForbiddenException('Not enrolled in this class');
    }

    return {
      ...cls,
      enrolled_count: enrollResult.count ?? 0,
    };
  }

  // ----------------------------------------------------------------
  // POST /classes/join
  // Students join via a cohort invite code (cohorts.invite_pin).
  // ----------------------------------------------------------------
  async join(studentId: string, dto: JoinClassDto) {
    this.logger.log(
      `join() called — studentId=${studentId} invite_code="${dto.invite_code}"`,
    );

    // Look up the cohort by its invite code
    const { data: cohort, error: cohortError } =
      asSingleQueryResult<CohortRecord>(
        await this.supabase.adminClient
          .from('cohorts')
          .select('id, class_id')
          .eq('invite_pin', dto.invite_code.trim().toUpperCase())
          .maybeSingle(),
      );

    this.logger.log(
      `cohort lookup — data=${JSON.stringify(cohort)} error=${JSON.stringify(cohortError)}`,
    );

    if (cohortError) throw new BadRequestException(cohortError.message);
    if (!cohort) throw new NotFoundException('Invalid invite code');

    // Block if the student is already enrolled in this class (any cohort)
    const { data: existing } = asSingleQueryResult<IdRow>(
      await this.supabase.adminClient
        .from('enrollments')
        .select('id')
        .eq('class_id', cohort.class_id)
        .eq('student_id', studentId)
        .maybeSingle(),
    );

    if (existing)
      throw new BadRequestException('Already enrolled in this class');

    const { error: enrollError } = await this.supabase.adminClient
      .from('enrollments')
      .insert({
        class_id: cohort.class_id,
        student_id: studentId,
        cohort_id: cohort.id,
      });

    if (enrollError) {
      this.logger.error(
        `enrollment insert failed — ${JSON.stringify(enrollError)}`,
      );
      throw new BadRequestException(enrollError.message);
    }

    // Return the class record so the frontend can redirect
    const { data: cls, error: clsError } = asSingleQueryResult<JoinClassRecord>(
      await this.supabase.adminClient
        .from('classes')
        .select('*')
        .eq('id', cohort.class_id)
        .single(),
    );

    if (clsError || !cls) throw new BadRequestException('Could not fetch class after joining');

    this.logger.log(
      `student ${studentId} joined class ${cls.id} via cohort ${cohort.id}`,
    );
    return cls;
  }

  // ----------------------------------------------------------------
  // GET /classes/:id/roster
  // ----------------------------------------------------------------
  async getRoster(classId: string, userId: string, role: string | null) {
    const { data: cls, error: clsError } = asSingleQueryResult<
      Pick<ClassRecord, 'id' | 'tutor_id'>
    >(
      await this.supabase.adminClient
        .from('classes')
        .select('id, tutor_id')
        .eq('id', classId)
        .single(),
    );

    if (clsError || !cls) throw new NotFoundException('Class not found');
    if (role !== 'admin' && cls.tutor_id !== userId)
      throw new ForbiddenException();

    const { data: enrollments, error: enrError } =
      asQueryResult<RosterEnrollmentRow>(
        await this.supabase.adminClient
          .from('enrollments')
          .select('enrolled_at, student:profiles!student_id(*)')
          .eq('class_id', classId)
          .order('enrolled_at', { ascending: true }),
      );

    if (enrError) throw new BadRequestException(enrError.message);

    const { count: totalSessions } = await this.supabase.adminClient
      .from('attendance_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId);

    const { data: sessions } = asQueryResult<IdRow>(
      await this.supabase.adminClient
        .from('attendance_sessions')
        .select('id')
        .eq('class_id', classId),
    );

    const sessionIds = (sessions ?? []).map((s) => s.id);

    const attendanceByStudent = new Map<string, number>();
    if (sessionIds.length > 0) {
      const { data: records } = asQueryResult<AttendanceRecordRow>(
        await this.supabase.adminClient
          .from('attendance_records')
          .select('student_id')
          .in('session_id', sessionIds),
      );

      for (const rec of records ?? []) {
        attendanceByStudent.set(
          rec.student_id,
          (attendanceByStudent.get(rec.student_id) ?? 0) + 1,
        );
      }
    }

    const { data: assignments } = asQueryResult<IdRow>(
      await this.supabase.adminClient
        .from('assignments')
        .select('id')
        .eq('class_id', classId),
    );

    const assignmentIds = (assignments ?? []).map((a) => a.id);

    const submissionsByStudent = new Map<string, number>();
    if (assignmentIds.length > 0) {
      const { data: submissions } = asQueryResult<AttendanceRecordRow>(
        await this.supabase.adminClient
          .from('submissions')
          .select('student_id')
          .in('assignment_id', assignmentIds),
      );

      for (const sub of submissions ?? []) {
        submissionsByStudent.set(
          sub.student_id,
          (submissionsByStudent.get(sub.student_id) ?? 0) + 1,
        );
      }
    }

    return (enrollments ?? []).map((row) => {
      const student = unwrapRelation(row.student);
      if (!student) {
        throw new BadRequestException('Roster entry is missing a student');
      }
      const attended = attendanceByStudent.get(student.id) ?? 0;
      const attendance_pct =
        totalSessions && totalSessions > 0
          ? Math.round((attended / totalSessions) * 100)
          : 0;

      return {
        student,
        attendance_pct,
        submission_count: submissionsByStudent.get(student.id) ?? 0,
        enrolled_at: row.enrolled_at,
      };
    });
  }

  // ----------------------------------------------------------------
  // GET /classes/:id/students/searchable
  // Returns students (role='student') NOT yet enrolled in this class.
  // ----------------------------------------------------------------
  async searchNonEnrolledStudents(
    classId: string,
    adminId: string,
    role: string | null,
    query: string,
  ) {
    const { data: cls, error: clsErr } = asSingleQueryResult<Pick<ClassRecord, 'id' | 'tutor_id'>>(
      await this.supabase.adminClient
        .from('classes')
        .select('id, tutor_id')
        .eq('id', classId)
        .single(),
    );
    if (clsErr || !cls) throw new NotFoundException('Class not found');
    if (role === 'tutor') {
      // Verify tutor has a cohort in this class
      const { data: cohort } = await this.supabase.adminClient
        .from('cohorts')
        .select('id')
        .eq('class_id', classId)
        .eq('ta_id', adminId)
        .maybeSingle();
      if (!cohort) throw new ForbiddenException('No cohort assigned for this class');
    } else if (role !== 'admin') {
      throw new ForbiddenException();
    }

    // Get all already-enrolled student IDs for this class
    const { data: enrolled } = asQueryResult<{ student_id: string }>(
      await this.supabase.adminClient
        .from('enrollments')
        .select('student_id')
        .eq('class_id', classId),
    );
    const enrolledIds = (enrolled ?? []).map((e) => e.student_id);

    // Search all students by name/email
    let studentQuery = this.supabase.adminClient
      .from('profiles')
      .select('id, full_name, email, avatar_initials')
      .eq('role', 'student')
      .order('full_name', { ascending: true })
      .limit(20);

    if (query.trim()) {
      studentQuery = studentQuery.or(
        `full_name.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%`,
      );
    }

    if (enrolledIds.length > 0) {
      studentQuery = studentQuery.not('id', 'in', `(${enrolledIds.join(',')})`);
    }

    const { data, error } = await studentQuery;
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  // ----------------------------------------------------------------
  // DELETE /classes/:id
  // ----------------------------------------------------------------
  async remove(classId: string, userId: string, role: string | null) {
    const { data: cls, error } = asSingleQueryResult<
      Pick<ClassRecord, 'id' | 'tutor_id'>
    >(
      await this.supabase.adminClient
        .from('classes')
        .select('id, tutor_id')
        .eq('id', classId)
        .single(),
    );

    if (error || !cls) throw new NotFoundException('Class not found');
    if (role !== 'admin' && cls.tutor_id !== userId)
      throw new ForbiddenException();

    const { error: deleteError } = await this.supabase.adminClient
      .from('classes')
      .delete()
      .eq('id', classId);

    if (deleteError) throw new BadRequestException(deleteError.message);
  }
}

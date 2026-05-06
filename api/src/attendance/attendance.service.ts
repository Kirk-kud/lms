import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { JwtPayload } from '../auth/jwt.strategy';
import {
  assertTutorOwnsCohort,
  getTutorCohortForClass,
} from '../common/access.helper';
import {
  CheckInDto,
  CreateSessionDto,
  ExtendSessionDto,
  RestartSessionDto,
} from './attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly supabase: SupabaseService) {}

  // ----------------------------------------------------------------
  // Access helpers
  // ----------------------------------------------------------------

  private async assertTutorOwnsClass(
    classId: string,
    tutorId: string,
    role?: string | null,
  ) {
    const { data, error } = await this.supabase.adminClient
      .from('classes')
      .select('id, tutor_id')
      .eq('id', classId)
      .single();

    if (error || !data) throw new NotFoundException('Class not found');
    if (role !== 'admin' && data.tutor_id !== tutorId)
      throw new ForbiddenException();
    return data;
  }

  private async assertStudentEnrolled(classId: string, studentId: string) {
    const { data } = await this.supabase.adminClient
      .from('enrollments')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (!data) throw new ForbiddenException('Not enrolled in this class');
  }

  // ----------------------------------------------------------------
  // POST /attendance/sessions
  // ----------------------------------------------------------------
  async createSession(
    tutorId: string,
    role: string | null,
    dto: CreateSessionDto,
  ) {
    await this.assertTutorOwnsClass(dto.class_id, tutorId, role);

    // Deactivate any existing active sessions for this class
    await this.supabase.adminClient
      .from('attendance_sessions')
      .update({ is_active: false })
      .eq('class_id', dto.class_id)
      .eq('is_active', true);

    const pin_code = Math.floor(1000 + Math.random() * 9000).toString();
    const durationMs = (dto.duration_minutes ?? 10) * 60 * 1000;
    const expires_at = new Date(Date.now() + durationMs).toISOString();

    const { data: session, error } = await this.supabase.adminClient
      .from('attendance_sessions')
      .insert({
        class_id: dto.class_id,
        pin_code,
        expires_at,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Broadcast to Realtime — fire-and-forget, don't let broadcast failure
    // block the response
    this.supabase.adminClient
      .channel(`attendance:${dto.class_id}`)
      .send({
        type: 'broadcast',
        event: 'session_started',
        payload: {
          session_id: session.id,
          pin_code: session.pin_code,
          expires_at: session.expires_at,
          class_id: dto.class_id,
        },
      })
      .catch(() => undefined);

    // Tutor receives the full session including pin_code
    return session;
  }

  // ----------------------------------------------------------------
  // GET /attendance/sessions/class/:classId
  // ----------------------------------------------------------------
  async getSessionsByClass(classId: string, user: JwtPayload) {
    if (user.role === 'admin') {
      await this.assertTutorOwnsClass(classId, user.sub, user.role);
    } else if (user.role === 'tutor') {
      // Validates the tutor has a cohort in this class — throws 403 if not
      await getTutorCohortForClass(this.supabase, classId, user.sub);
    } else {
      throw new ForbiddenException();
    }

    const { data: sessions, error } = await this.supabase.adminClient
      .from('attendance_sessions')
      .select('*')
      .eq('class_id', classId)
      .order('started_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    const list = sessions ?? [];
    if (list.length === 0) return [];

    const sessionIds = list.map((s) => s.id);

    // Enrolled count for absent calculation
    const { count: enrolledCount } = await this.supabase.adminClient
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId);

    // Record counts per session
    const { data: records } = await this.supabase.adminClient
      .from('attendance_records')
      .select('session_id')
      .in('session_id', sessionIds);

    const presentBySession = new Map<string, number>();
    for (const r of records ?? []) {
      presentBySession.set(
        r.session_id,
        (presentBySession.get(r.session_id) ?? 0) + 1,
      );
    }

    const enrolled = enrolledCount ?? 0;
    return list.map((s) => {
      const present_count = presentBySession.get(s.id) ?? 0;
      return { ...s, present_count, absent_count: enrolled - present_count };
    });
  }

  // ----------------------------------------------------------------
  // GET /attendance/sessions/:sessionId/records
  // ----------------------------------------------------------------
  async getSessionRecords(
    sessionId: string,
    user: JwtPayload,
    cohortId?: string,
  ) {
    const { data: session, error: sErr } = await this.supabase.adminClient
      .from('attendance_sessions')
      .select('id, class_id')
      .eq('id', sessionId)
      .single();

    if (sErr || !session) throw new NotFoundException('Session not found');

    if (user.role === 'admin') {
      await this.assertTutorOwnsClass(session.class_id, user.sub, user.role);
      if (cohortId) {
        await this.assertCohortInSessionClass(cohortId, session.class_id);
      }
    } else if (user.role === 'tutor') {
      if (!cohortId) {
        throw new ForbiddenException('cohort_id is required for tutors');
      }
      const cohort = await assertTutorOwnsCohort(
        this.supabase,
        cohortId,
        user.sub,
      );
      if (cohort.class_id !== session.class_id) {
        throw new ForbiddenException(
          'Cohort does not belong to this session class',
        );
      }
    } else {
      throw new ForbiddenException();
    }

    // Present: students with a record for this session
    let recordsQuery = this.supabase.adminClient
      .from('attendance_records')
      .select('*, student:profiles!student_id(*)')
      .eq('session_id', sessionId);

    if (cohortId) {
      const { data: cohortEnrollments, error: cohortError } =
        await this.supabase.adminClient
          .from('enrollments')
          .select('student_id')
          .eq('class_id', session.class_id)
          .eq('cohort_id', cohortId);

      if (cohortError) throw new BadRequestException(cohortError.message);
      const studentIds = (cohortEnrollments ?? []).map((e) => e.student_id);
      if (studentIds.length === 0) return { present: [], absent: [] };
      recordsQuery = recordsQuery.in('student_id', studentIds);
    }

    const { data: records } = await recordsQuery;

    const presentStudentIds = new Set(
      (records ?? []).map((r) => r.student.id as string),
    );

    // All enrolled students
    let enrollmentsQuery = this.supabase.adminClient
      .from('enrollments')
      .select('student:profiles!student_id(*)')
      .eq('class_id', session.class_id);

    if (cohortId) {
      enrollmentsQuery = enrollmentsQuery.eq('cohort_id', cohortId);
    }

    const { data: enrollments } = await enrollmentsQuery;

    const absent = (enrollments ?? [])
      .map((e) => e.student as Record<string, any>)
      .filter((s) => !presentStudentIds.has(s.id));

    return {
      present: (records ?? []).map((r) => ({
        student: r.student,
        checked_in_at: r.checked_in_at,
      })),
      absent,
    };
  }

  private async assertCohortInSessionClass(cohortId: string, classId: string) {
    const { data, error } = await this.supabase.adminClient
      .from('cohorts')
      .select('id, class_id')
      .eq('id', cohortId)
      .single();

    if (error || !data) throw new NotFoundException('Cohort not found');
    if (data.class_id !== classId) {
      throw new ForbiddenException(
        'Cohort does not belong to this session class',
      );
    }
  }

  // ----------------------------------------------------------------
  // POST /attendance/checkin
  // ----------------------------------------------------------------
  async checkIn(studentId: string, dto: CheckInDto) {
    await this.assertStudentEnrolled(dto.class_id, studentId);

    // Find active, unexpired session for this class
    const { data: session } = await this.supabase.adminClient
      .from('attendance_sessions')
      .select('id, pin_code')
      .eq('class_id', dto.class_id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!session) throw new NotFoundException('No active session');
    if (session.pin_code !== dto.pin_code) {
      throw new BadRequestException('Incorrect PIN');
    }

    // Check not already checked in
    const { data: existing } = await this.supabase.adminClient
      .from('attendance_records')
      .select('id')
      .eq('session_id', session.id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existing) throw new BadRequestException('Already checked in');

    const checked_in_at = new Date().toISOString();
    const { error } = await this.supabase.adminClient
      .from('attendance_records')
      .insert({ session_id: session.id, student_id: studentId, checked_in_at });

    if (error) throw new BadRequestException(error.message);

    return { success: true, checked_in_at, session_id: session.id };
  }

  // ----------------------------------------------------------------
  // POST /attendance/sessions/:sessionId/records/manual
  // Admin manually marks a student as present for any session.
  // ----------------------------------------------------------------
  async manualCheckIn(
    sessionId: string,
    actorId: string,
    role: string | null,
    studentId: string,
  ) {
    const { data: session, error: sErr } = await this.supabase.adminClient
      .from('attendance_sessions')
      .select('id, class_id')
      .eq('id', sessionId)
      .single();

    if (sErr || !session) throw new NotFoundException('Session not found');

    if (role === 'tutor') {
      // Tutor must have a cohort in this class, and the student must be in that cohort
      const cohort = await getTutorCohortForClass(
        this.supabase,
        session.class_id,
        actorId,
      );
      const { data: enrollment } = await this.supabase.adminClient
        .from('enrollments')
        .select('id')
        .eq('class_id', session.class_id)
        .eq('student_id', studentId)
        .eq('cohort_id', cohort.id)
        .maybeSingle();
      if (!enrollment)
        throw new ForbiddenException('Student is not in your cohort');
    } else {
      await this.assertTutorOwnsClass(session.class_id, actorId, role);
      // Student must be enrolled in the class
      await this.assertStudentEnrolled(session.class_id, studentId);
    }

    // Idempotent: skip if already checked in
    const { data: existing } = await this.supabase.adminClient
      .from('attendance_records')
      .select('id')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existing)
      throw new BadRequestException('Student is already marked present');

    const checked_in_at = new Date().toISOString();
    const { error } = await this.supabase.adminClient
      .from('attendance_records')
      .insert({ session_id: sessionId, student_id: studentId, checked_in_at });

    if (error) throw new BadRequestException(error.message);

    return {
      success: true,
      checked_in_at,
      session_id: sessionId,
      student_id: studentId,
    };
  }

  // ----------------------------------------------------------------
  // GET /attendance/my/:classId
  // ----------------------------------------------------------------
  async getMyAttendance(studentId: string, classId: string) {
    await this.assertStudentEnrolled(classId, studentId);

    const { data: sessions, error } = await this.supabase.adminClient
      .from('attendance_sessions')
      .select('*')
      .eq('class_id', classId)
      .order('started_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    const list = sessions ?? [];
    if (list.length === 0) return [];

    const sessionIds = list.map((s) => s.id);

    const { data: records } = await this.supabase.adminClient
      .from('attendance_records')
      .select('session_id, checked_in_at')
      .eq('student_id', studentId)
      .in('session_id', sessionIds);

    const recordBySession = new Map(
      (records ?? []).map((r) => [r.session_id, r.checked_in_at]),
    );

    return list.map((s) => {
      const checked_in_at = recordBySession.get(s.id) ?? null;
      return { session: s, present: checked_in_at !== null, checked_in_at };
    });
  }

  // ----------------------------------------------------------------
  // PATCH /attendance/sessions/:sessionId
  // ----------------------------------------------------------------
  async endSession(sessionId: string, user: JwtPayload) {
    // Fetch the session to validate ownership
    const { data: session, error: sessionError } =
      await this.supabase.adminClient
        .from('attendance_sessions')
        .select('id, class_id')
        .eq('id', sessionId)
        .single();

    if (sessionError || !session) {
      throw new NotFoundException('Session not found');
    }

    // Only tutors who own the class can end the session
    if (user.role === 'admin') {
      await this.assertTutorOwnsClass(session.class_id, user.sub, user.role);
    } else if (user.role === 'tutor') {
      // Validate tutor has a cohort in this class
      await getTutorCohortForClass(this.supabase, session.class_id, user.sub);
    } else {
      throw new ForbiddenException();
    }

    // Mark session as inactive
    const { data: updated, error: updateError } =
      await this.supabase.adminClient
        .from('attendance_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)
        .select()
        .single();

    if (updateError) throw new BadRequestException(updateError.message);

    return updated;
  }

  // ----------------------------------------------------------------
  // POST /attendance/sessions/:sessionId/restart
  // ----------------------------------------------------------------
  async restartSession(
    sessionId: string,
    user: JwtPayload,
    dto: RestartSessionDto,
  ) {
    const { data: session, error: sErr } = await this.supabase.adminClient
      .from('attendance_sessions')
      .select('id, class_id')
      .eq('id', sessionId)
      .single();

    if (sErr || !session) throw new NotFoundException('Session not found');

    if (user.role === 'admin') {
      await this.assertTutorOwnsClass(session.class_id, user.sub, user.role);
    } else if (user.role === 'tutor') {
      await getTutorCohortForClass(this.supabase, session.class_id, user.sub);
    } else {
      throw new ForbiddenException();
    }

    // Deactivate any currently active session for this class first
    await this.supabase.adminClient
      .from('attendance_sessions')
      .update({ is_active: false })
      .eq('class_id', session.class_id)
      .eq('is_active', true);

    const durationMs = (dto.duration_minutes ?? 10) * 60 * 1000;
    const expires_at = new Date(Date.now() + durationMs).toISOString();

    const { data: updated, error } = await this.supabase.adminClient
      .from('attendance_sessions')
      .update({ is_active: true, expires_at })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return updated;
  }

  // ----------------------------------------------------------------
  // POST /attendance/sessions/:sessionId/extend
  // ----------------------------------------------------------------
  async extendSession(
    sessionId: string,
    user: JwtPayload,
    dto: ExtendSessionDto,
  ) {
    const { data: session, error: sErr } = await this.supabase.adminClient
      .from('attendance_sessions')
      .select('id, class_id, expires_at, is_active')
      .eq('id', sessionId)
      .single();

    if (sErr || !session) throw new NotFoundException('Session not found');
    if (!session.is_active)
      throw new BadRequestException('Session is not active');

    if (user.role === 'admin') {
      await this.assertTutorOwnsClass(session.class_id, user.sub, user.role);
    } else if (user.role === 'tutor') {
      await getTutorCohortForClass(this.supabase, session.class_id, user.sub);
    } else {
      throw new ForbiddenException();
    }

    const durationMs = dto.duration_minutes * 60 * 1000;
    const base = Math.max(new Date(session.expires_at).getTime(), Date.now());
    const expires_at = new Date(base + durationMs).toISOString();

    const { data: updated, error } = await this.supabase.adminClient
      .from('attendance_sessions')
      .update({ expires_at })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return updated;
  }

  // ----------------------------------------------------------------
  // GET /attendance/class/:classId/student-summary
  // ----------------------------------------------------------------
  async getStudentSummary(
    classId: string,
    user: JwtPayload,
    from?: string,
    to?: string,
  ) {
    if (user.role !== 'admin') throw new ForbiddenException();
    await this.assertTutorOwnsClass(classId, user.sub, user.role);

    let sessionsQuery = this.supabase.adminClient
      .from('attendance_sessions')
      .select('id, started_at')
      .eq('class_id', classId);

    if (from) sessionsQuery = sessionsQuery.gte('started_at', from);
    if (to) sessionsQuery = sessionsQuery.lte('started_at', to);

    const { data: sessions, error: sErr } = await sessionsQuery;
    if (sErr) throw new BadRequestException(sErr.message);

    const sessionList = sessions ?? [];
    const sessionIds = sessionList.map((s) => s.id);

    const { data: enrollments, error: eErr } = await this.supabase.adminClient
      .from('enrollments')
      .select(
        'student_id, profiles!student_id(id, full_name, email, avatar_initials)',
      )
      .eq('class_id', classId);

    if (eErr) throw new BadRequestException(eErr.message);

    if (sessionIds.length === 0) {
      return {
        sessions_count: 0,
        students: (enrollments ?? []).map((e) => ({
          student: e.profiles,
          sessions_attended: 0,
          sessions_total: 0,
          rate: 0,
        })),
      };
    }

    const { data: records } = await this.supabase.adminClient
      .from('attendance_records')
      .select('session_id, student_id')
      .in('session_id', sessionIds);

    const attendedMap = new Map<string, Set<string>>();
    for (const r of records ?? []) {
      if (!attendedMap.has(r.student_id))
        attendedMap.set(r.student_id, new Set());
      attendedMap.get(r.student_id)!.add(r.session_id);
    }

    const students = (enrollments ?? [])
      .map((e) => {
        const student = e.profiles as Record<string, any>;
        const attended = attendedMap.get(student.id)?.size ?? 0;
        return {
          student,
          sessions_attended: attended,
          sessions_total: sessionIds.length,
          rate:
            sessionIds.length > 0
              ? Math.round((attended / sessionIds.length) * 100)
              : 0,
        };
      })
      .sort((a, b) => b.rate - a.rate);

    return { sessions_count: sessionIds.length, students };
  }

  // ----------------------------------------------------------------
  // DELETE /attendance/sessions/:sessionId
  // ----------------------------------------------------------------
  async deleteSession(sessionId: string, user: JwtPayload) {
    const { data: session, error: sErr } = await this.supabase.adminClient
      .from('attendance_sessions')
      .select('id, class_id')
      .eq('id', sessionId)
      .single();

    if (sErr || !session) throw new NotFoundException('Session not found');
    await this.assertTutorOwnsClass(session.class_id, user.sub, user.role);

    // Delete records first to satisfy FK constraints
    await this.supabase.adminClient
      .from('attendance_records')
      .delete()
      .eq('session_id', sessionId);

    const { error } = await this.supabase.adminClient
      .from('attendance_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }

  // ----------------------------------------------------------------
  // DELETE /attendance/sessions/:sessionId/records/:studentId
  // ----------------------------------------------------------------
  async markAbsent(sessionId: string, user: JwtPayload, studentId: string) {
    const { data: session, error: sErr } = await this.supabase.adminClient
      .from('attendance_sessions')
      .select('id, class_id')
      .eq('id', sessionId)
      .single();

    if (sErr || !session) throw new NotFoundException('Session not found');
    await this.assertTutorOwnsClass(session.class_id, user.sub, user.role);

    const { error } = await this.supabase.adminClient
      .from('attendance_records')
      .delete()
      .eq('session_id', sessionId)
      .eq('student_id', studentId);

    if (error) throw new BadRequestException(error.message);
    return { success: true };
  }
}

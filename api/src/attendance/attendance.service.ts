import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CheckInDto, CreateSessionDto } from './attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly supabase: SupabaseService) {}

  // ----------------------------------------------------------------
  // Access helpers
  // ----------------------------------------------------------------

  private async assertTutorOwnsClass(classId: string, tutorId: string) {
    const { data, error } = await this.supabase.adminClient
      .from('classes')
      .select('id, tutor_id')
      .eq('id', classId)
      .single();

    if (error || !data) throw new NotFoundException('Class not found');
    if (data.tutor_id !== tutorId) throw new ForbiddenException();
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
  async createSession(tutorId: string, dto: CreateSessionDto) {
    await this.assertTutorOwnsClass(dto.class_id, tutorId);

    // Deactivate any existing active sessions for this class
    await this.supabase.adminClient
      .from('attendance_sessions')
      .update({ is_active: false })
      .eq('class_id', dto.class_id)
      .eq('is_active', true);

    const pin_code = Math.floor(1000 + Math.random() * 9000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

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
  async getSessionsByClass(classId: string, tutorId: string) {
    await this.assertTutorOwnsClass(classId, tutorId);

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
  async getSessionRecords(sessionId: string, tutorId: string) {
    const { data: session, error: sErr } = await this.supabase.adminClient
      .from('attendance_sessions')
      .select('id, class_id')
      .eq('id', sessionId)
      .single();

    if (sErr || !session) throw new NotFoundException('Session not found');
    await this.assertTutorOwnsClass(session.class_id, tutorId);

    // Present: students with a record for this session
    const { data: records } = await this.supabase.adminClient
      .from('attendance_records')
      .select('*, student:profiles!student_id(*)')
      .eq('session_id', sessionId);

    const presentStudentIds = new Set(
      (records ?? []).map((r) => (r.student as any).id as string),
    );

    // All enrolled students
    const { data: enrollments } = await this.supabase.adminClient
      .from('enrollments')
      .select('student:profiles!student_id(*)')
      .eq('class_id', session.class_id);

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
}

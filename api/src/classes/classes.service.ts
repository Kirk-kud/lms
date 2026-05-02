import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateClassDto, JoinClassDto } from './classes.dto';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(private readonly supabase: SupabaseService) {}

  // ----------------------------------------------------------------
  // POST /classes
  // ----------------------------------------------------------------
  async create(adminId: string, dto: CreateClassDto) {
    const invite_code = this.generateInviteCode();

    const { data, error } = await this.supabase.adminClient
      .from('classes')
      .insert({
        tutor_id: adminId,
        title: dto.title,
        description: dto.description ?? null,
        zoom_link: dto.zoom_link ?? null,
        invite_code,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
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
      const { data, error } = await this.supabase.adminClient
        .from('classes')
        .select('*, enrollments(count)')
        .eq('tutor_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new BadRequestException(error.message);
      return this.flattenCount(data ?? []);
    }

    if (role === 'tutor') {
      const { data, error } = await this.supabase.adminClient
        .from('cohorts')
        .select(
          'class:classes(*, enrollments(count)), cohort_id:id, cohort_name:name',
        )
        .eq('ta_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new BadRequestException(error.message);
      return (data ?? []).map((row) => {
        const cls = row.class as Record<string, any>;
        return {
          ...this.flattenCountSingle(cls),
          cohort_id: row.cohort_id,
          cohort_name: row.cohort_name,
        };
      });
    }

    // student
    const { data, error } = await this.supabase.adminClient
      .from('enrollments')
      .select('enrolled_at, cohort_id, class:classes(*, enrollments(count))')
      .eq('student_id', userId)
      .order('enrolled_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    return (data ?? []).map((row) => {
      const cls = row.class as Record<string, any>;
      return {
        ...this.flattenCountSingle(cls),
        enrolled_at: row.enrolled_at,
        cohort_id: row.cohort_id,
      };
    });
  }

  // ----------------------------------------------------------------
  // GET /classes/:id
  // ----------------------------------------------------------------
  async findOne(classId: string, userId: string, role: string | null) {
    const { data: cls, error } = await this.supabase.adminClient
      .from('classes')
      .select('*, tutor:profiles!tutor_id(*), enrollments(count)')
      .eq('id', classId)
      .single();

    if (error || !cls) throw new NotFoundException('Class not found');

    if (role === 'admin') {
      if (cls.tutor_id !== userId) throw new ForbiddenException();
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

    return this.flattenCountSingle(cls);
  }

  // ----------------------------------------------------------------
  // POST /classes/join
  // ----------------------------------------------------------------
  async join(studentId: string, dto: JoinClassDto) {
    this.logger.log(
      `join() called — studentId=${studentId} invite_code="${dto.invite_code}"`,
    );

    const { data: cls, error: clsError } = await this.supabase.adminClient
      .from('classes')
      .select('*')
      .eq('invite_code', dto.invite_code)
      .maybeSingle();

    this.logger.log(
      `classes query — data=${JSON.stringify(cls)} error=${JSON.stringify(clsError)}`,
    );

    if (clsError) throw new BadRequestException(clsError.message);
    if (!cls) throw new NotFoundException('Invalid invite code');

    const { data: existing, error: existingError } =
      await this.supabase.adminClient
        .from('enrollments')
        .select('id')
        .eq('class_id', cls.id)
        .eq('student_id', studentId)
        .maybeSingle();

    this.logger.log(
      `enrollment check — existing=${JSON.stringify(existing)} error=${JSON.stringify(existingError)}`,
    );

    if (existing)
      throw new BadRequestException('Already enrolled in this class');

    if (dto.cohort_id) {
      const { data: cohort, error: cohortError } =
        await this.supabase.adminClient
          .from('cohorts')
          .select('id, class_id')
          .eq('id', dto.cohort_id)
          .single();

      if (cohortError || !cohort)
        throw new NotFoundException('Cohort not found');
      if (cohort.class_id !== cls.id) {
        throw new BadRequestException('Cohort does not belong to this class');
      }
    }

    const { error: enrollError } = await this.supabase.adminClient
      .from('enrollments')
      .insert({
        class_id: cls.id,
        student_id: studentId,
        cohort_id: dto.cohort_id ?? null,
      });

    if (enrollError) {
      this.logger.error(
        `enrollment insert failed — ${JSON.stringify(enrollError)}`,
      );
      throw new BadRequestException(enrollError.message);
    }

    this.logger.log(
      `student ${studentId} successfully enrolled in class ${cls.id}`,
    );
    return cls;
  }

  // ----------------------------------------------------------------
  // GET /classes/:id/roster
  // ----------------------------------------------------------------
  async getRoster(classId: string, tutorId: string) {
    // Verify ownership
    const { data: cls, error: clsError } = await this.supabase.adminClient
      .from('classes')
      .select('id, tutor_id')
      .eq('id', classId)
      .single();

    if (clsError || !cls) throw new NotFoundException('Class not found');
    if (cls.tutor_id !== tutorId) throw new ForbiddenException();

    // Enrollments + student profiles
    const { data: enrollments, error: enrError } =
      await this.supabase.adminClient
        .from('enrollments')
        .select('enrolled_at, student:profiles!student_id(*)')
        .eq('class_id', classId)
        .order('enrolled_at', { ascending: true });

    if (enrError) throw new BadRequestException(enrError.message);

    // Total session count for this class
    const { count: totalSessions } = await this.supabase.adminClient
      .from('attendance_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId);

    // Attendance records for all sessions of this class
    const { data: sessions } = await this.supabase.adminClient
      .from('attendance_sessions')
      .select('id')
      .eq('class_id', classId);

    const sessionIds = (sessions ?? []).map((s) => s.id);

    const attendanceByStudent = new Map<string, number>();
    if (sessionIds.length > 0) {
      const { data: records } = await this.supabase.adminClient
        .from('attendance_records')
        .select('student_id')
        .in('session_id', sessionIds);

      for (const rec of records ?? []) {
        attendanceByStudent.set(
          rec.student_id,
          (attendanceByStudent.get(rec.student_id) ?? 0) + 1,
        );
      }
    }

    // Submission counts per student for this class's assignments
    const { data: assignments } = await this.supabase.adminClient
      .from('assignments')
      .select('id')
      .eq('class_id', classId);

    const assignmentIds = (assignments ?? []).map((a) => a.id);

    const submissionsByStudent = new Map<string, number>();
    if (assignmentIds.length > 0) {
      const { data: submissions } = await this.supabase.adminClient
        .from('submissions')
        .select('student_id')
        .in('assignment_id', assignmentIds);

      for (const sub of submissions ?? []) {
        submissionsByStudent.set(
          sub.student_id,
          (submissionsByStudent.get(sub.student_id) ?? 0) + 1,
        );
      }
    }

    return (enrollments ?? []).map((row) => {
      const student = row.student as Record<string, any>;
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
  // DELETE /classes/:id
  // ----------------------------------------------------------------
  async remove(classId: string, tutorId: string) {
    const { data: cls, error } = await this.supabase.adminClient
      .from('classes')
      .select('id, tutor_id')
      .eq('id', classId)
      .single();

    if (error || !cls) throw new NotFoundException('Class not found');
    if (cls.tutor_id !== tutorId) throw new ForbiddenException();

    const { error: deleteError } = await this.supabase.adminClient
      .from('classes')
      .delete()
      .eq('id', classId);

    if (deleteError) throw new BadRequestException(deleteError.message);
  }

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  private flattenCount(rows: any[]): any[] {
    return rows.map((r) => this.flattenCountSingle(r));
  }

  private flattenCountSingle(row: any): any {
    const { enrollments, ...rest } = row;
    const enrolled_count: number = Array.isArray(enrollments)
      ? (enrollments[0]?.count ?? 0)
      : 0;
    return { ...rest, enrolled_count };
  }
}

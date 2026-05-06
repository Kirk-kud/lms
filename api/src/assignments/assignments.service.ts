import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  assertCohortBelongsToClass,
  getTutorCohortForClass,
} from '../common/access.helper';
import { CreateAssignmentDto, UpdateAssignmentDto } from './assignments.dto';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

@Injectable()
export class AssignmentsService {
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
      .select('id, cohort_id')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (!data) throw new ForbiddenException('Not enrolled in this class');
    return data;
  }

  private async assertTutorOwnsAssignment(
    assignmentId: string,
    tutorId: string,
    role?: string | null,
  ) {
    const { data, error } = await this.supabase.adminClient
      .from('assignments')
      .select('id, class_id')
      .eq('id', assignmentId)
      .single();

    if (error || !data) throw new NotFoundException('Assignment not found');
    if (role === 'tutor') {
      await getTutorCohortForClass(this.supabase, data.class_id, tutorId);
    } else {
      await this.assertTutorOwnsClass(data.class_id, tutorId, role);
    }
    return data;
  }

  // ----------------------------------------------------------------
  // GET /assignments/class/:classId
  // ----------------------------------------------------------------
  async findByClass(
    classId: string,
    userId: string,
    role: string | null,
    cohortId?: string,
  ) {
    if (!classId) throw new BadRequestException('class_id is required');

    let scopedCohortId: string | null | undefined = cohortId;

    if (role === 'admin') {
      await this.assertTutorOwnsClass(classId, userId, role);
      if (cohortId) {
        await assertCohortBelongsToClass(this.supabase, classId, cohortId);
      }
    } else if (role === 'tutor') {
      const cohort = await getTutorCohortForClass(
        this.supabase,
        classId,
        userId,
      );
      if (cohortId && cohortId !== cohort.id) throw new ForbiddenException();
      scopedCohortId = cohort.id;
    } else {
      const enrollment = await this.assertStudentEnrolled(classId, userId);
      if (cohortId && cohortId !== enrollment.cohort_id)
        throw new ForbiddenException();
      scopedCohortId = enrollment.cohort_id;
    }

    let query = this.supabase.adminClient
      .from('assignments')
      .select('*')
      .eq('class_id', classId)
      .order('week_number', { ascending: true });

    if (role === 'admin' && cohortId) {
      query = query.eq('cohort_id', cohortId);
    } else if (role !== 'admin') {
      query = scopedCohortId
        ? query.or(`cohort_id.is.null,cohort_id.eq.${scopedCohortId}`)
        : query.is('cohort_id', null);
    }

    const { data: assignments, error } = await query;

    if (error) throw new BadRequestException(error.message);
    const list = assignments ?? [];
    if (list.length === 0) return [];

    const assignmentIds = list.map((a) => a.id);

    if (role === 'admin' || role === 'tutor') {
      return this.enrichForTutor(classId, list, assignmentIds);
    }
    return this.enrichForStudent(userId, list, assignmentIds);
  }

  async findBatchForAdmin(classIds: string[]) {
    const ids = [...new Set(classIds.filter(Boolean))];
    if (ids.length === 0) return {};

    const { data: assignments, error } = await this.supabase.adminClient
      .from('assignments')
      .select('*')
      .in('class_id', ids)
      .order('week_number', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    const list = assignments ?? [];
    if (list.length === 0) {
      return Object.fromEntries(ids.map((id) => [id, []]));
    }

    const assignmentIds = list.map((a) => a.id);
    const [enrollmentResult, submissionResult] = await Promise.all([
      this.supabase.adminClient
        .from('enrollments')
        .select('class_id')
        .in('class_id', ids),
      this.supabase.adminClient
        .from('submissions')
        .select('assignment_id')
        .in('assignment_id', assignmentIds),
    ]);

    if (enrollmentResult.error) {
      throw new BadRequestException(enrollmentResult.error.message);
    }
    if (submissionResult.error) {
      throw new BadRequestException(submissionResult.error.message);
    }

    const enrolledByClass = new Map<string, number>();
    for (const row of enrollmentResult.data ?? []) {
      enrolledByClass.set(
        row.class_id,
        (enrolledByClass.get(row.class_id) ?? 0) + 1,
      );
    }

    const submissionCountByAssignment = new Map<string, number>();
    for (const row of submissionResult.data ?? []) {
      submissionCountByAssignment.set(
        row.assignment_id,
        (submissionCountByAssignment.get(row.assignment_id) ?? 0) + 1,
      );
    }

    const grouped: Record<string, any[]> = Object.fromEntries(
      ids.map((id) => [id, []]),
    );
    for (const assignment of list) {
      const submission_count =
        submissionCountByAssignment.get(assignment.id) ?? 0;
      const enrolled = enrolledByClass.get(assignment.class_id) ?? 0;
      grouped[assignment.class_id].push({
        ...assignment,
        submission_count,
        missing_count: enrolled - submission_count,
      });
    }

    return grouped;
  }

  private async enrichForTutor(
    classId: string,
    assignments: any[],
    assignmentIds: string[],
  ) {
    const { count: enrolledCount } = await this.supabase.adminClient
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId);

    const { data: subs } = await this.supabase.adminClient
      .from('submissions')
      .select('assignment_id')
      .in('assignment_id', assignmentIds);

    const countByAssignment = new Map<string, number>();
    for (const s of subs ?? []) {
      countByAssignment.set(
        s.assignment_id,
        (countByAssignment.get(s.assignment_id) ?? 0) + 1,
      );
    }

    const enrolled = enrolledCount ?? 0;
    return assignments.map((a) => {
      const submission_count = countByAssignment.get(a.id) ?? 0;
      return {
        ...a,
        submission_count,
        missing_count: enrolled - submission_count,
      };
    });
  }

  private async enrichForStudent(
    studentId: string,
    assignments: any[],
    assignmentIds: string[],
  ) {
    const { data: subs } = await this.supabase.adminClient
      .from('submissions')
      .select(
        'id, assignment_id, student_id, file_url, file_name, status, submitted_at',
      )
      .eq('student_id', studentId)
      .in('assignment_id', assignmentIds);

    const paths = (subs ?? [])
      .map((s) => s.file_url)
      .filter((p): p is string => !!p);
    const signedUrlMap = new Map<string, string>();
    if (paths.length > 0) {
      const { data: signedUrls } = await this.supabase.adminClient.storage
        .from('submissions')
        .createSignedUrls(paths, 3600);
      for (const item of signedUrls ?? []) {
        if (item.signedUrl && item.path)
          signedUrlMap.set(item.path, item.signedUrl);
      }
    }

    const subByAssignment = new Map(
      (subs ?? []).map((s) => [
        s.assignment_id,
        { ...s, signed_url: signedUrlMap.get(s.file_url) ?? null },
      ]),
    );

    return assignments.map((a) => ({
      ...a,
      submission: subByAssignment.get(a.id) ?? null,
    }));
  }

  // ----------------------------------------------------------------
  // GET /assignments/mine  (all assignments for the current user)
  // ----------------------------------------------------------------
  async findAllForUser(userId: string, role: string) {
    let classIds: string[] = [];

    if (role === 'student') {
      const { data } = await this.supabase.adminClient
        .from('enrollments')
        .select('class_id')
        .eq('student_id', userId);
      classIds = (data ?? []).map((e) => e.class_id);
    } else {
      const { data } = await this.supabase.adminClient
        .from('classes')
        .select('id')
        .eq('tutor_id', userId);
      classIds = (data ?? []).map((c) => c.id);
    }

    if (classIds.length === 0) return [];

    const { data: assignments, error } = await this.supabase.adminClient
      .from('assignments')
      .select('*, class:classes!class_id(id, title)')
      .in('class_id', classIds)
      .order('due_date', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    const list = assignments ?? [];
    if (list.length === 0) return [];

    if (role === 'student') {
      const ids = list.map((a) => a.id);
      const { data: subs } = await this.supabase.adminClient
        .from('submissions')
        .select(
          'id, assignment_id, student_id, file_url, file_name, status, submitted_at',
        )
        .eq('student_id', userId)
        .in('assignment_id', ids);

      const subPaths = (subs ?? [])
        .map((s) => s.file_url)
        .filter((p): p is string => !!p);
      const subSignedMap = new Map<string, string>();
      if (subPaths.length > 0) {
        const { data: signedUrls } = await this.supabase.adminClient.storage
          .from('submissions')
          .createSignedUrls(subPaths, 3600);
        for (const item of signedUrls ?? []) {
          if (item.signedUrl && item.path)
            subSignedMap.set(item.path, item.signedUrl);
        }
      }

      const subMap = new Map(
        (subs ?? []).map((s) => [
          s.assignment_id,
          { ...s, signed_url: subSignedMap.get(s.file_url) ?? null },
        ]),
      );
      return list.map((a) => ({ ...a, submission: subMap.get(a.id) ?? null }));
    }

    return list;
  }

  // ----------------------------------------------------------------
  // POST /assignments
  // ----------------------------------------------------------------
  async create(tutorId: string, role: string | null, dto: CreateAssignmentDto) {
    await this.assertTutorOwnsClass(dto.class_id, tutorId, role);
    if (dto.cohort_id) {
      await assertCohortBelongsToClass(
        this.supabase,
        dto.class_id,
        dto.cohort_id,
      );
    }

    const { data, error } = await this.supabase.adminClient
      .from('assignments')
      .insert({
        class_id: dto.class_id,
        title: dto.title,
        description: dto.description ?? null,
        week_number: dto.week_number,
        due_date: dto.due_date,
        cohort_id: dto.cohort_id ?? null,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ----------------------------------------------------------------
  // PATCH /assignments/:id
  // ----------------------------------------------------------------
  async update(
    assignmentId: string,
    tutorId: string,
    role: string | null,
    dto: UpdateAssignmentDto,
  ) {
    const assignment = await this.assertTutorOwnsAssignment(
      assignmentId,
      tutorId,
      role,
    );
    if (dto.cohort_id) {
      await assertCohortBelongsToClass(
        this.supabase,
        assignment.class_id,
        dto.cohort_id,
      );
    }

    const { data, error } = await this.supabase.adminClient
      .from('assignments')
      .update(dto)
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ----------------------------------------------------------------
  // DELETE /assignments/:id
  // ----------------------------------------------------------------
  async remove(assignmentId: string, tutorId: string, role: string | null) {
    await this.assertTutorOwnsAssignment(assignmentId, tutorId, role);

    const { error } = await this.supabase.adminClient
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) throw new BadRequestException(error.message);
  }

  // ----------------------------------------------------------------
  // GET /assignments/:id/submissions
  // ----------------------------------------------------------------
  async getSubmissions(
    assignmentId: string,
    tutorId: string,
    role: string | null,
  ) {
    const { data: assignment, error: aErr } = await this.supabase.adminClient
      .from('assignments')
      .select('id, class_id')
      .eq('id', assignmentId)
      .single();

    if (aErr || !assignment)
      throw new NotFoundException('Assignment not found');

    let cohortId: string | undefined;
    if (role === 'tutor') {
      const cohort = await getTutorCohortForClass(
        this.supabase,
        assignment.class_id,
        tutorId,
      );
      cohortId = cohort.id;
    } else {
      await this.assertTutorOwnsClass(assignment.class_id, tutorId, role);
    }

    // All enrolled students (scoped to cohort for tutors)
    let enrollmentsQuery = this.supabase.adminClient
      .from('enrollments')
      .select('student:profiles!student_id(*)')
      .eq('class_id', assignment.class_id);

    if (cohortId) {
      enrollmentsQuery = enrollmentsQuery.eq('cohort_id', cohortId);
    }

    const { data: enrollments } = await enrollmentsQuery;

    // All submissions for this assignment
    const { data: submissions } = await this.supabase.adminClient
      .from('submissions')
      .select('*, student:profiles!student_id(*)')
      .eq('assignment_id', assignmentId);

    const submittedByStudent = new Map(
      (submissions ?? []).map((s) => [s.student.id, s]),
    );

    return (enrollments ?? []).map((e) => {
      const student = e.student as Record<string, any>;
      const submission = submittedByStudent.get(student.id) ?? null;
      return {
        student,
        submission,
        status: submission ? submission.status : 'missing',
      };
    });
  }

  // ----------------------------------------------------------------
  // POST /assignments/:id/submit
  // ----------------------------------------------------------------
  async submit(
    assignmentId: string,
    studentId: string,
    file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('File is required');
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      throw new BadRequestException('Only PDF files are accepted');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File must be under 15 MB');
    }

    const { data: assignment, error: aErr } = await this.supabase.adminClient
      .from('assignments')
      .select('id, class_id, due_date')
      .eq('id', assignmentId)
      .single();

    if (aErr || !assignment)
      throw new NotFoundException('Assignment not found');
    await this.assertStudentEnrolled(assignment.class_id, studentId);

    const status =
      new Date() > new Date(assignment.due_date) ? 'late' : 'submitted';

    const storagePath = `${studentId}/${assignmentId}/${Date.now()}_${file.originalname}`;

    const { error: uploadError } = await this.supabase.adminClient.storage
      .from('submissions')
      .upload(storagePath, file.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) throw new BadRequestException(uploadError.message);

    const { data: submission, error: upsertError } =
      await this.supabase.adminClient
        .from('submissions')
        .upsert(
          {
            assignment_id: assignmentId,
            student_id: studentId,
            file_url: storagePath,
            file_name: file.originalname,
            status,
            submitted_at: new Date().toISOString(),
          },
          { onConflict: 'assignment_id,student_id' },
        )
        .select()
        .single();

    if (upsertError) throw new BadRequestException(upsertError.message);

    const { data: signedUrlData, error: signError } =
      await this.supabase.adminClient.storage
        .from('submissions')
        .createSignedUrl(storagePath, 3600);

    if (signError) throw new BadRequestException(signError.message);

    return { submission, signed_url: signedUrlData.signedUrl };
  }

  // ----------------------------------------------------------------
  // GET /assignments/:id/submissions/:submissionId/view-url
  // ----------------------------------------------------------------
  async getSubmissionViewUrl(
    assignmentId: string,
    submissionId: string,
    userId: string,
    role: string | null,
  ) {
    const { data: submission, error } = await this.supabase.adminClient
      .from('submissions')
      .select('id, assignment_id, file_url')
      .eq('id', submissionId)
      .eq('assignment_id', assignmentId)
      .single();

    if (error || !submission)
      throw new NotFoundException('Submission not found');
    await this.assertTutorOwnsAssignment(assignmentId, userId, role);

    const { data: signedUrlData, error: signError } =
      await this.supabase.adminClient.storage
        .from('submissions')
        .createSignedUrl(submission.file_url, 3600);

    if (signError) throw new BadRequestException(signError.message);
    return { signed_url: signedUrlData.signedUrl };
  }

  // ----------------------------------------------------------------
  // PATCH /assignments/:id/submissions/:submissionId
  // ----------------------------------------------------------------
  async gradeSubmission(
    assignmentId: string,
    submissionId: string,
    userId: string,
    role: string | null,
    dto: import('./assignments.dto').GradeSubmissionDto,
  ) {
    await this.assertTutorOwnsAssignment(assignmentId, userId, role);

    const { data, error } = await this.supabase.adminClient
      .from('submissions')
      .update({
        grade: dto.grade,
        feedback: dto.feedback ?? null,
        graded_at: new Date().toISOString(),
        graded_by: userId,
      })
      .eq('id', submissionId)
      .eq('assignment_id', assignmentId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Submission not found');
    return data;
  }
}

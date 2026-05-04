import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { JwtPayload } from '../auth/jwt.strategy';
import {
  assertAdminOwnsClass,
  assertTutorOwnsCohort,
} from '../common/access.helper';
import {
  AddCohortStudentDto,
  CreateCohortDto,
  UpdateCohortDto,
} from './cohorts.dto';

@Injectable()
export class CohortsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(classId: string, user: JwtPayload) {
    if (!classId) throw new BadRequestException('class_id is required');

    let query = this.supabase.adminClient
      .from('cohorts')
      .select('*, ta:profiles!ta_id(id, full_name, email, role)')
      .eq('class_id', classId)
      .order('created_at', { ascending: true });

    if (user.role === 'admin') {
      await assertAdminOwnsClass(this.supabase, classId, user.sub, user.role);
    } else if (user.role === 'tutor') {
      query = query.eq('ta_id', user.sub);
    } else {
      throw new ForbiddenException();
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async create(adminId: string, role: string | null, dto: CreateCohortDto) {
    await assertAdminOwnsClass(this.supabase, dto.class_id, adminId, role);
    await this.assertTutorRole(dto.ta_id);

    const { data, error } = await this.supabase.adminClient
      .from('cohorts')
      .insert({
        class_id: dto.class_id,
        name: dto.name,
        ta_id: dto.ta_id ?? null,
        zoom_link: dto.zoom_link ?? null,
        invite_pin: dto.invite_pin ?? null,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async findOne(id: string, user: JwtPayload) {
    const cohort = await this.getCohort(id);

    if (user.role === 'admin') {
      await assertAdminOwnsClass(
        this.supabase,
        cohort.class_id,
        user.sub,
        user.role,
      );
    } else if (user.role === 'tutor') {
      if (cohort.ta_id !== user.sub) throw new ForbiddenException();
    } else {
      const { data: enrollment } = await this.supabase.adminClient
        .from('enrollments')
        .select('id')
        .eq('cohort_id', id)
        .eq('student_id', user.sub)
        .maybeSingle();
      if (!enrollment) throw new ForbiddenException();
    }

    return cohort;
  }

  async update(
    id: string,
    adminId: string,
    role: string | null,
    dto: UpdateCohortDto,
  ) {
    const cohort = await this.getCohort(id);
    await assertAdminOwnsClass(this.supabase, cohort.class_id, adminId, role);
    await this.assertTutorRole(dto.ta_id);

    const { data, error } = await this.supabase.adminClient
      .from('cohorts')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async remove(id: string, adminId: string, role: string | null) {
    const cohort = await this.getCohort(id);
    await assertAdminOwnsClass(this.supabase, cohort.class_id, adminId, role);

    const { error } = await this.supabase.adminClient
      .from('cohorts')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
  }

  async getStudents(id: string, user: JwtPayload) {
    const cohort = await this.assertCanManageCohortStudents(id, user);

    const { data, error } = await this.supabase.adminClient
      .from('enrollments')
      .select(
        'id, enrolled_at, student:profiles!student_id(id, full_name, email, role)',
      )
      .eq('class_id', cohort.class_id)
      .eq('cohort_id', id)
      .order('enrolled_at', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async addStudent(id: string, user: JwtPayload, dto: AddCohortStudentDto) {
    const cohort = await this.assertCanManageCohortStudents(id, user);
    await this.assertStudentRole(dto.student_id);

    const { data, error } = await this.supabase.adminClient
      .from('enrollments')
      .upsert(
        {
          class_id: cohort.class_id,
          student_id: dto.student_id,
          cohort_id: id,
        },
        { onConflict: 'student_id,class_id' },
      )
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async removeStudent(id: string, user: JwtPayload, studentId: string) {
    await this.assertCanManageCohortStudents(id, user);

    const { error } = await this.supabase.adminClient
      .from('enrollments')
      .update({ cohort_id: null })
      .eq('cohort_id', id)
      .eq('student_id', studentId);

    if (error) throw new BadRequestException(error.message);
  }

  private async assertCanManageCohortStudents(id: string, user: JwtPayload) {
    const cohort = await this.getCohort(id);
    if (user.role === 'admin') {
      await assertAdminOwnsClass(
        this.supabase,
        cohort.class_id,
        user.sub,
        user.role,
      );
    } else if (user.role === 'tutor') {
      await assertTutorOwnsCohort(this.supabase, id, user.sub);
    } else {
      throw new ForbiddenException();
    }
    return cohort;
  }

  private async getCohort(id: string) {
    const { data, error } = await this.supabase.adminClient
      .from('cohorts')
      .select('*, ta:profiles!ta_id(id, full_name, email, role)')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Cohort not found');
    return data;
  }

  private async assertTutorRole(userId?: string) {
    if (!userId) return;
    const { data, error } = await this.supabase.adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Tutor profile not found');
    if (data.role !== 'tutor') {
      throw new BadRequestException('Assigned user must have tutor role');
    }
  }

  private async assertStudentRole(userId: string) {
    const { data, error } = await this.supabase.adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (error || !data)
      throw new NotFoundException('Student profile not found');
    if (data.role !== 'student') {
      throw new BadRequestException('Assigned user must have student role');
    }
  }
}

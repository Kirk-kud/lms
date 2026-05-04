import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  assertAdminOwnsClass,
  assertCohortBelongsToClass,
} from '../common/access.helper';
import {
  CreateEnrollmentDto,
  MoveEnrollmentCohortDto,
} from './enrollments.dto';

export interface EnrollmentRecord {
  id: string;
  class_id: string;
  student_id?: string;
  cohort_id?: string | null;
}

@Injectable()
export class EnrollmentsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(adminId: string, role: string | null, dto: CreateEnrollmentDto) {
    await assertAdminOwnsClass(this.supabase, dto.class_id, adminId, role);
    if (dto.cohort_id) {
      await assertCohortBelongsToClass(
        this.supabase,
        dto.class_id,
        dto.cohort_id,
      );
    }

    const createResult = await this.supabase.adminClient
      .from('enrollments')
      .upsert(
        {
          student_id: dto.student_id,
          class_id: dto.class_id,
          cohort_id: dto.cohort_id ?? null,
        },
        { onConflict: 'student_id,class_id' },
      )
      .select()
      .single();
    const { data, error } = createResult as {
      data: EnrollmentRecord | null;
      error: { message: string } | null;
    };

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new BadRequestException('Enrollment was not returned');
    return data;
  }

  async moveToCohort(
    enrollmentId: string,
    adminId: string,
    role: string | null,
    dto: MoveEnrollmentCohortDto,
  ) {
    const { data: enrollmentData, error } = await this.supabase.adminClient
      .from('enrollments')
      .select('id, class_id')
      .eq('id', enrollmentId)
      .single();

    if (error || !enrollmentData)
      throw new NotFoundException('Enrollment not found');
    const enrollment = enrollmentData as EnrollmentRecord;

    await assertAdminOwnsClass(
      this.supabase,
      enrollment.class_id,
      adminId,
      role,
    );

    if (dto.cohort_id) {
      await assertCohortBelongsToClass(
        this.supabase,
        enrollment.class_id,
        dto.cohort_id,
      );
    }

    const updateResult = await this.supabase.adminClient
      .from('enrollments')
      .update({ cohort_id: dto.cohort_id ?? null })
      .eq('id', enrollmentId)
      .select()
      .single();
    const { data, error: updateError } = updateResult as {
      data: EnrollmentRecord | null;
      error: { message: string } | null;
    };

    if (updateError) throw new BadRequestException(updateError.message);
    if (!data) throw new BadRequestException('Enrollment was not returned');
    return data;
  }
}

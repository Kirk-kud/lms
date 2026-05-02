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

@Injectable()
export class EnrollmentsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(adminId: string, dto: CreateEnrollmentDto) {
    await assertAdminOwnsClass(this.supabase, dto.class_id, adminId);
    if (dto.cohort_id) {
      await assertCohortBelongsToClass(
        this.supabase,
        dto.class_id,
        dto.cohort_id,
      );
    }

    const { data, error } = await this.supabase.adminClient
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

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async moveToCohort(
    enrollmentId: string,
    adminId: string,
    dto: MoveEnrollmentCohortDto,
  ) {
    const { data: enrollment, error } = await this.supabase.adminClient
      .from('enrollments')
      .select('id, class_id')
      .eq('id', enrollmentId)
      .single();

    if (error || !enrollment)
      throw new NotFoundException('Enrollment not found');
    await assertAdminOwnsClass(this.supabase, enrollment.class_id, adminId);

    if (dto.cohort_id) {
      await assertCohortBelongsToClass(
        this.supabase,
        enrollment.class_id,
        dto.cohort_id,
      );
    }

    const { data, error: updateError } = await this.supabase.adminClient
      .from('enrollments')
      .update({ cohort_id: dto.cohort_id ?? null })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (updateError) throw new BadRequestException(updateError.message);
    return data;
  }
}

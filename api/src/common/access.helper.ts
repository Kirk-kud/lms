import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export async function assertAdminOwnsClass(
  supabase: SupabaseService,
  classId: string,
  adminId: string,
) {
  const { data, error } = await supabase.adminClient
    .from('classes')
    .select('id, tutor_id')
    .eq('id', classId)
    .single();

  if (error || !data) throw new NotFoundException('Class not found');
  if (data.tutor_id !== adminId) throw new ForbiddenException();
  return data;
}

export async function assertStudentEnrolled(
  supabase: SupabaseService,
  classId: string,
  studentId: string,
) {
  const { data } = await supabase.adminClient
    .from('enrollments')
    .select('id, cohort_id')
    .eq('class_id', classId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (!data) throw new ForbiddenException('Not enrolled in this class');
  return data;
}

export async function getTutorCohortForClass(
  supabase: SupabaseService,
  classId: string,
  tutorId: string,
) {
  const { data, error } = await supabase.adminClient
    .from('cohorts')
    .select('*')
    .eq('class_id', classId)
    .eq('ta_id', tutorId)
    .maybeSingle();

  if (error) throw new BadRequestException(error.message);
  if (!data) throw new ForbiddenException('No cohort assigned for this class');
  return data;
}

export async function assertTutorOwnsCohort(
  supabase: SupabaseService,
  cohortId: string,
  tutorId: string,
) {
  const { data, error } = await supabase.adminClient
    .from('cohorts')
    .select('*')
    .eq('id', cohortId)
    .maybeSingle();

  if (error) throw new BadRequestException(error.message);
  if (!data) throw new NotFoundException('Cohort not found');
  if (data.ta_id !== tutorId) throw new ForbiddenException();
  return data;
}

export async function assertCohortBelongsToClass(
  supabase: SupabaseService,
  classId: string,
  cohortId: string,
) {
  const { data, error } = await supabase.adminClient
    .from('cohorts')
    .select('*')
    .eq('id', cohortId)
    .single();

  if (error || !data) throw new NotFoundException('Cohort not found');
  if (data.class_id !== classId) {
    throw new BadRequestException('Cohort does not belong to this class');
  }
  return data;
}

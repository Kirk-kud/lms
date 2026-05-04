import { IsOptional, IsUUID } from 'class-validator';

export class CreateEnrollmentDto {
  @IsUUID()
  student_id: string;

  @IsUUID()
  class_id: string;

  @IsOptional()
  @IsUUID()
  cohort_id?: string;
}

export class MoveEnrollmentCohortDto {
  @IsOptional()
  @IsUUID()
  cohort_id?: string | null;
}

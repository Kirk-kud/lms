import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/** What students submit for this assignment. */
export type ExpectedSubmissionType = 'pdf_file' | 'text' | 'link';

export class CreateAssignmentDto {
  @IsUUID()
  class_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  week_number: number;

  @IsDateString()
  due_date: string;

  @IsOptional()
  @IsUUID()
  cohort_id?: string;

  @IsOptional()
  @IsIn(['pdf_file', 'text', 'link'])
  expected_submission_type?: ExpectedSubmissionType;

  @IsOptional()
  @IsIn(['score', 'pass_fail'])
  grade_type?: 'score' | 'pass_fail';

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  instruction_link_url?: string;

  /** Optional pasted instructions (students read on the assignment page). */
  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  instruction_text?: string;
}

export class SubmitAssignmentBodyDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(50_000)
  submission_text?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(2048)
  submission_link_url?: string;
}

export class GradeSubmissionDto {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  grade: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}

export class ManualGradeDto {
  @IsUUID()
  student_id: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  grade: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}

export class UpdateAssignmentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsUUID()
  cohort_id?: string;

  @IsOptional()
  @IsIn(['pdf_file', 'text', 'link'])
  expected_submission_type?: ExpectedSubmissionType;

  @IsOptional()
  @IsIn(['score', 'pass_fail'])
  grade_type?: 'score' | 'pass_fail';

  @IsOptional()
  instruction_link_url?: string | null;

  @IsOptional()
  instruction_text?: string | null;

  /** Remove the uploaded PDF handout from storage and clear path/name columns. */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  clear_instruction_pdf?: boolean;
}

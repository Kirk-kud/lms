import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(['all_tutors', 'whole_class', 'specific_cohort'])
  target_type: 'all_tutors' | 'whole_class' | 'specific_cohort';

  @IsOptional()
  @IsUUID()
  class_id?: string;

  @IsOptional()
  @IsUUID()
  cohort_id?: string;
}

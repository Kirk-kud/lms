import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCohortDto {
  @IsUUID()
  class_id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  ta_id?: string;

  @IsOptional()
  @IsString()
  zoom_link?: string;

  @IsOptional()
  @IsString()
  invite_pin?: string;
}

export class UpdateCohortDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  ta_id?: string;

  @IsOptional()
  @IsString()
  zoom_link?: string;

  @IsOptional()
  @IsString()
  invite_pin?: string;

  @IsOptional()
  @IsBoolean()
  can_edit_modules?: boolean;
}

export class AddCohortStudentDto {
  @IsUUID()
  student_id: string;
}

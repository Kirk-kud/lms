import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

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
}

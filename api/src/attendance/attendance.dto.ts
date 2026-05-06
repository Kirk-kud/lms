import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSessionDto {
  @IsUUID()
  class_id: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  @Type(() => Number)
  duration_minutes?: number;
}

export class RestartSessionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  @Type(() => Number)
  duration_minutes?: number;
}

export class CheckInDto {
  @IsString()
  pin_code: string;

  @IsUUID()
  class_id: string;
}

export class ManualCheckInDto {
  @IsUUID()
  student_id: string;
}

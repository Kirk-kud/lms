import { IsString, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @IsUUID()
  class_id: string;
}

export class CheckInDto {
  @IsString()
  pin_code: string;

  @IsUUID()
  class_id: string;
}

import { IsOptional, IsString } from 'class-validator';

export class CreateClassDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class JoinClassDto {
  @IsString()
  invite_code: string;
}

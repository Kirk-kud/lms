import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateClassDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  zoom_link?: string;
}

export class JoinClassDto {
  @IsString()
  invite_code: string;
}

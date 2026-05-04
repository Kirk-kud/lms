import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateAnnouncementDto {
  @IsUUID()
  class_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}

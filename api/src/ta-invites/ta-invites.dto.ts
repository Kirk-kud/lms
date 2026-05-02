import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTaInviteDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID()
  cohort_id?: string;
}

export class RedeemTaInviteDto {
  @IsString()
  code: string;
}

import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export type UserRole = 'admin' | 'tutor' | 'student';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  full_name: string;

  @IsIn(['admin', 'tutor', 'student'])
  role: UserRole;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

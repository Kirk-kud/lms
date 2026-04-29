import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  full_name: string;

  @IsIn(['tutor', 'student'])
  role: 'tutor' | 'student';
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

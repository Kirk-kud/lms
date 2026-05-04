import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const { data, error } =
      await this.supabase.adminClient.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
        user_metadata: { full_name: dto.full_name, role: dto.role },
      });

    if (error) {
      throw new BadRequestException(error.message);
    }

    const user = data.user;

    const { error: profileError } = await this.supabase.adminClient
      .from('profiles')
      .insert({
        id: user.id,
        full_name: dto.full_name,
        email: dto.email,
        role: dto.role,
      });

    if (profileError) {
      // Roll back the auth user to avoid orphaned records
      await this.supabase.adminClient.auth.admin.deleteUser(user.id);
      throw new BadRequestException(profileError.message);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: dto.full_name,
        role: dto.role,
      },
    };
  }

  async login(dto: LoginDto) {
    const { data, error } =
      await this.supabase.adminClient.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { user } = data;
    const meta = user.user_metadata as Record<string, string>;
    const role = meta.role ?? null;

    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role,
    });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        full_name: meta.full_name ?? null,
        role,
      },
    };
  }

  async getMe(userId: string) {
    const { data, error } = await this.supabase.adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new UnauthorizedException('Profile not found');
    }

    return data;
  }

  async getMeFromAccessToken(accessToken: string) {
    const userClient = this.supabase.getClientForUser(accessToken);
    const { data, error } = await userClient.auth.getUser();
    if (error || !data.user?.id) {
      throw new UnauthorizedException('Invalid session');
    }

    return this.getMe(data.user.id);
  }
}

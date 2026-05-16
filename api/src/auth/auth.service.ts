import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './auth.dto';

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
    // Create a temporary client for auth operations to avoid polluting adminClient.auth state
    const tempAuthClient = createClient(
      this.supabase.supabaseUrl,
      this.supabase.anonKey,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data, error } = await tempAuthClient.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { user } = data;
    const meta = user.user_metadata as Record<string, string>;
    const role = meta.role ?? null;

    // Generate tokens with different expiration times
    const access_token = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role,
      },
      {
        expiresIn: '30m', // Short-lived access token
      },
    );

    const refresh_token = this.jwtService.sign(
      {
        sub: user.id,
        type: 'refresh',
      },
      {
        expiresIn: '7d', // Long-lived refresh token
      },
    );

    return {
      access_token,
      refresh_token,
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

  async refresh(dto: RefreshTokenDto) {
    let payload: {
      sub: string;
      type: string;
    };

    try {
      payload = this.jwtService.verify<{
        sub: string;
        type: string;
      }>(dto.refresh_token);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const { data: user_data, error } = await this.supabase.adminClient
      .from('profiles')
      .select('*')
      .eq('id', payload.sub)
      .single();

    if (error || !user_data) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new access token
    const access_token = this.jwtService.sign(
      {
        sub: user_data.id,
        email: user_data.email,
        role: user_data.role,
      },
      {
        expiresIn: '30m',
      },
    );

    const refresh_token = this.jwtService.sign(
      {
        sub: user_data.id,
        type: 'refresh',
      },
      {
        expiresIn: '7d',
      },
    );

    return {
      access_token,
      refresh_token,
    };
  }
}

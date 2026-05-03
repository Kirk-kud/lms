import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SupabaseService } from '../supabase/supabase.service';
import type { UserRole } from './auth.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole | null;
}

const PROFILE_ROLE_CACHE_TTL_MS = 60 * 1000;

interface CachedProfileRole {
  role: UserRole | null;
  expiresAt: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly profileRoleCache = new Map<string, CachedProfileRole>();

  constructor(
    configService: ConfigService,
    private readonly supabase: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('SUPABASE_JWT_SECRET'),
    });
  }

  async validate(payload: Record<string, unknown>): Promise<JwtPayload> {
    const userId = this.getString(payload.sub);
    const metadata = this.getRecord(payload.user_metadata);
    const metadataRole = this.normalizeRole(metadata?.role);
    const profileRole = await this.getProfileRole(userId);

    return {
      sub: userId,
      email: this.getString(payload.email),
      role: profileRole ?? metadataRole,
    };
  }

  private async getProfileRole(userId: string): Promise<UserRole | null> {
    const cached = this.profileRoleCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.role;
    }

    const { data } = await this.supabase.adminClient
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    const profile = data as { role?: unknown } | null;
    const role = this.normalizeRole(profile?.role);
    this.profileRoleCache.set(userId, {
      role,
      expiresAt: Date.now() + PROFILE_ROLE_CACHE_TTL_MS,
    });
    return role;
  }

  private normalizeRole(role: unknown): UserRole | null {
    if (role === 'admin' || role === 'tutor' || role === 'student') {
      return role;
    }

    return null;
  }

  private getString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private getRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : null;
  }
}

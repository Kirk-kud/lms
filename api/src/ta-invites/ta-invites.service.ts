import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { assertAdminOwnsClass } from '../common/access.helper';
import { CreateTaInviteDto, RedeemTaInviteDto } from './ta-invites.dto';

interface CohortLookup {
  class_id: string;
}

interface RedeemableInvite {
  id: string;
  cohort_id: string | null;
  used: boolean | null;
  cohort: unknown;
}

@Injectable()
export class TaInvitesService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(adminId: string, role: string | null, dto: CreateTaInviteDto) {
    if (dto.cohort_id) {
      const { data: cohortData, error } = await this.supabase.adminClient
        .from('cohorts')
        .select('id, class_id')
        .eq('id', dto.cohort_id)
        .single();

      if (error || !cohortData) throw new NotFoundException('Cohort not found');
      const cohort = this.toCohortLookup(cohortData);
      await assertAdminOwnsClass(this.supabase, cohort.class_id, adminId, role);
    }

    const code = await this.generateUniqueCode();
    const { data, error } = await this.supabase.adminClient
      .from('ta_invites')
      .insert({
        code,
        email: dto.email ?? null,
        cohort_id: dto.cohort_id ?? null,
        created_by: adminId,
      })
      .select('code')
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async redeem(dto: RedeemTaInviteDto) {
    const code = dto.code.trim().toUpperCase();
    const { data: inviteData, error } = await this.supabase.adminClient
      .from('ta_invites')
      .select('id, cohort_id, used, cohort:cohorts(*)')
      .eq('code', code)
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    const invite = inviteData as RedeemableInvite | null;
    if (!invite || invite.used) {
      return { valid: false, cohort_id: null };
    }

    const { error: updateError } = await this.supabase.adminClient
      .from('ta_invites')
      .update({ used: true })
      .eq('id', invite.id);

    if (updateError) throw new BadRequestException(updateError.message);

    return {
      valid: true,
      cohort_id: invite.cohort_id,
      cohort: invite.cohort,
    };
  }

  private async generateUniqueCode() {
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = this.randomCode();
      const { data } = await this.supabase.adminClient
        .from('ta_invites')
        .select('id')
        .eq('code', code)
        .maybeSingle();

      if (!data) return code;
    }

    throw new BadRequestException('Unable to generate invite code');
  }

  private randomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private toCohortLookup(value: unknown): CohortLookup {
    const record =
      value && typeof value === 'object'
        ? (value as Record<string, unknown>)
        : null;

    if (typeof record?.class_id !== 'string') {
      throw new NotFoundException('Cohort not found');
    }

    return { class_id: record.class_id };
  }
}

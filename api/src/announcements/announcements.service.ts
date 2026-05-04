import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateAnnouncementDto } from './announcements.dto';

interface QueryError {
  message: string;
}

interface QueryResult<T> {
  data: T[] | null;
  error: QueryError | null;
}

interface SingleQueryResult<T> {
  data: T | null;
  error: QueryError | null;
}

export interface AnnouncementRecord {
  id: string;
  created_by: string | null;
  message: string;
  target_type: 'all_tutors' | 'whole_class' | 'specific_cohort';
  class_id: string | null;
  cohort_id: string | null;
  created_at: string;
  creator?: { full_name: string } | { full_name: string }[] | null;
}

interface IdRow {
  id: string;
}

function asQueryResult<T>(value: unknown): QueryResult<T> {
  return value as QueryResult<T>;
}

function asSingleQueryResult<T>(value: unknown): SingleQueryResult<T> {
  return value as SingleQueryResult<T>;
}

@Injectable()
export class AnnouncementsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(): Promise<AnnouncementRecord[]> {
    const { data, error } = asQueryResult<AnnouncementRecord>(
      await this.supabase.adminClient
        .from('announcements')
        .select('*, creator:profiles!created_by(full_name)')
        .order('created_at', { ascending: false }),
    );

    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async create(
    userId: string,
    dto: CreateAnnouncementDto,
  ): Promise<AnnouncementRecord> {
    const { data, error } = asSingleQueryResult<AnnouncementRecord>(
      await this.supabase.adminClient
        .from('announcements')
        .insert({
          created_by: userId,
          message: dto.message,
          target_type: dto.target_type,
          class_id: dto.class_id ?? null,
          cohort_id: dto.cohort_id ?? null,
        })
        .select('*, creator:profiles!created_by(full_name)')
        .single(),
    );

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new BadRequestException('Announcement was not created');
    return data;
  }

  async remove(id: string, userId: string, role: string | null): Promise<void> {
    if (role !== 'admin')
      throw new ForbiddenException('Insufficient permissions');
    void userId;

    const { data: existing, error: fetchError } = asSingleQueryResult<IdRow>(
      await this.supabase.adminClient
        .from('announcements')
        .select('id')
        .eq('id', id)
        .maybeSingle(),
    );

    if (fetchError) throw new BadRequestException(fetchError.message);
    if (!existing) throw new NotFoundException('Announcement not found');

    const { error } = await this.supabase.adminClient
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
  }
}

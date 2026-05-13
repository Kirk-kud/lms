import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { JwtPayload } from '../auth/jwt.strategy';
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
  is_anonymous: boolean;
  created_at: string;
  creator?: { full_name: string } | { full_name: string }[] | null;
}

interface IdRow {
  id: string;
}

interface StudentEnrollmentRow {
  class_id: string | null;
  cohort_id: string | null;
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

  async findAll(user: JwtPayload): Promise<AnnouncementRecord[]> {
    let query = this.supabase.adminClient
      .from('announcements')
      .select('*, creator:profiles!created_by(full_name)')
      .order('created_at', { ascending: false });

    if (user.role === 'student') {
      const { data: enrollments, error: enrollmentError } =
        asQueryResult<StudentEnrollmentRow>(
          await this.supabase.adminClient
            .from('enrollments')
            .select('class_id, cohort_id')
            .eq('student_id', user.sub),
        );

      if (enrollmentError)
        throw new BadRequestException(enrollmentError.message);

      const classIds = (enrollments ?? [])
        .map((e) => e.class_id)
        .filter((id): id is string => Boolean(id));
      const cohortIds = (enrollments ?? [])
        .map((e) => e.cohort_id)
        .filter((id): id is string => Boolean(id));

      if (classIds.length === 0) return [];

      const filters = [
        `and(target_type.eq.whole_class,class_id.in.(${classIds.join(',')}))`,
      ];

      if (cohortIds.length > 0) {
        filters.push(
          `and(target_type.eq.specific_cohort,cohort_id.in.(${cohortIds.join(',')}))`,
        );
      }

      query = query.or(filters.join(','));
    }

    const { data, error } = asQueryResult<AnnouncementRecord>(await query);

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
          is_anonymous: dto.is_anonymous ?? false,
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

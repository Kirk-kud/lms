import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateAnnouncementDto } from './announcements.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findForUser(userId: string, role: string) {
    let classIds: string[] = [];

    if (role === 'student') {
      const { data } = await this.supabase.adminClient
        .from('enrollments')
        .select('class_id')
        .eq('student_id', userId);
      classIds = (data ?? []).map((e) => e.class_id);
    } else {
      const { data } = await this.supabase.adminClient
        .from('classes')
        .select('id')
        .eq('tutor_id', userId);
      classIds = (data ?? []).map((c) => c.id);
    }

    if (classIds.length === 0) return [];

    const { data, error } = await this.supabase.adminClient
      .from('announcements')
      .select('*, author:profiles!author_id(full_name), class:classes!class_id(title)')
      .in('class_id', classIds)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async create(authorId: string, dto: CreateAnnouncementDto) {
    const { data: cls, error: clsErr } = await this.supabase.adminClient
      .from('classes')
      .select('id, tutor_id')
      .eq('id', dto.class_id)
      .single();

    if (clsErr || !cls) throw new NotFoundException('Class not found');
    if (cls.tutor_id !== authorId) throw new ForbiddenException();

    const { data, error } = await this.supabase.adminClient
      .from('announcements')
      .insert({
        class_id: dto.class_id,
        author_id: authorId,
        title: dto.title,
        body: dto.body,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SetMeetingScheduleDto } from './meeting-schedule.dto';

interface QueryError {
  message: string;
}

interface SingleQueryResult<T> {
  data: T | null;
  error: QueryError | null;
}

export interface MeetingScheduleRecord {
  id: string;
  days_of_week: string[];
  time_of_day: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

function asSingleQueryResult<T>(value: unknown): SingleQueryResult<T> {
  return value as SingleQueryResult<T>;
}

@Injectable()
export class MeetingScheduleService {
  constructor(private readonly supabase: SupabaseService) {}

  async getSchedule(): Promise<MeetingScheduleRecord | null> {
    const { data, error } = asSingleQueryResult<MeetingScheduleRecord>(
      await this.supabase.adminClient
        .from('meeting_schedule')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    );

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async setSchedule(
    dto: SetMeetingScheduleDto,
  ): Promise<MeetingScheduleRecord> {
    const { error: deleteError } = await this.supabase.adminClient
      .from('meeting_schedule')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) throw new BadRequestException(deleteError.message);

    const { data, error } = asSingleQueryResult<MeetingScheduleRecord>(
      await this.supabase.adminClient
        .from('meeting_schedule')
        .insert({
          days_of_week: dto.days_of_week,
          time_of_day: dto.time_of_day,
          start_date: dto.start_date,
          end_date: dto.end_date,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single(),
    );

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new BadRequestException('Meeting schedule was not saved');
    return data;
  }
}

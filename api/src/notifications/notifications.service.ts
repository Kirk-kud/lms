import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findForUser(userId: string) {
    const { data, error } = await this.supabase.adminClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async markRead(userId: string, notificationId: string) {
    const { error } = await this.supabase.adminClient
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }

  async markAllRead(userId: string) {
    const { error } = await this.supabase.adminClient
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw new Error(error.message);
  }
}

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

    if (error) {
      // If migrations haven't been applied the notifications table may not exist yet.
      // Return an empty list so the API remains functional until migrations are run.
      if (typeof error.message === 'string' && error.message.includes("Could not find the table 'public.notifications'")) {
        return [];
      }
      throw new Error(error.message);
    }

    return data ?? [];
  }

  async markRead(userId: string, notificationId: string) {
    const { error } = await this.supabase.adminClient
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      if (typeof error.message === 'string' && error.message.includes("Could not find the table 'public.notifications'")) {
        // No-op when notifications table is missing
        return;
      }
      throw new Error(error.message);
    }
  }

  async markAllRead(userId: string) {
    const { error } = await this.supabase.adminClient
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      if (typeof error.message === 'string' && error.message.includes("Could not find the table 'public.notifications'")) {
        // No-op when notifications table is missing
        return;
      }
      throw new Error(error.message);
    }
  }
}

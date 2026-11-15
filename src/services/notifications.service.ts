import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type NotificationPreferenceFlags = Partial<
  Pick<
    Database['public']['Tables']['notification_preferences']['Row'],
    'messages' | 'reactions' | 'groups' | 'calls' | 'recovery'
  >
>

export const notificationsService = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async markRead(id: string) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (error) throw error
  },

  async markAllRead(userId: string) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId)
    if (error) throw error
  },

  async remove(id: string) {
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (error) throw error
  },

  async getPreferences(userId: string) {
    const { data, error } = await supabase.from('notification_preferences').select('*').eq('user_id', userId).single()
    if (error) throw error
    return data
  },

  async updatePreferences(userId: string, prefs: NotificationPreferenceFlags) {
    const { error } = await supabase.from('notification_preferences').update(prefs).eq('user_id', userId)
    if (error) throw error
  },

  subscribe(userId: string, onInsert: (notification: { id: string }) => void) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => onInsert(payload.new as { id: string }),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  },
}

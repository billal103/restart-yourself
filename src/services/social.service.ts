import { supabase } from '@/lib/supabase/client'

/** Bookmarks, blocks, and content/communication reports. */
export const socialService = {
  async listMyBookmarks(userId: string) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('story_id, stories(*, categories(*))')
      .eq('user_id', userId)
    if (error) throw error
    return data
  },

  async toggleBookmark(userId: string, storyId: string, bookmarked: boolean) {
    if (bookmarked) {
      const { error } = await supabase.from('bookmarks').delete().match({ user_id: userId, story_id: storyId })
      if (error) throw error
    } else {
      const { error } = await supabase.from('bookmarks').insert({ user_id: userId, story_id: storyId })
      if (error) throw error
    }
  },

  async blockUser(blockerId: string, blockedId: string) {
    const { error } = await supabase.from('blocks').insert({ blocker_id: blockerId, blocked_id: blockedId })
    if (error) throw error
  },

  async unblockUser(blockerId: string, blockedId: string) {
    const { error } = await supabase.from('blocks').delete().match({ blocker_id: blockerId, blocked_id: blockedId })
    if (error) throw error
  },

  async listMyBlocks(blockerId: string) {
    const { data, error } = await supabase
      .from('blocks')
      .select('blocked_id, anonymous_profiles!blocks_blocked_id_profile_fkey(display_name, avatar_color)')
      .eq('blocker_id', blockerId)
    if (error) throw error
    return data
  },

  async reportContent(
    reporterId: string,
    targetType: 'story' | 'comment',
    targetId: string,
    reason: string,
  ) {
    const { error } = await supabase
      .from('reports')
      .insert({ reporter_id: reporterId, target_type: targetType, target_id: targetId, reason })
    if (error) throw error
  },

  async reportCommunication(
    reporterId: string,
    targetType: 'message' | 'conversation' | 'call' | 'group_message',
    targetId: string,
    reason: string,
  ) {
    const { error } = await supabase
      .from('communication_reports')
      .insert({ reporter_id: reporterId, target_type: targetType, target_id: targetId, reason })
    if (error) throw error
  },
}

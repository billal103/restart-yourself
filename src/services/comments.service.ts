import { supabase } from '@/lib/supabase/client'

export const commentsService = {
  async listForStory(storyId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select('*, anonymous_profiles!comments_author_id_profile_fkey(display_name, avatar_color)')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  async create(storyId: string, authorId: string, content: string, parentId?: string | null) {
    const { data, error } = await supabase
      .from('comments')
      .insert({ story_id: storyId, author_id: authorId, content, parent_id: parentId ?? null })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(commentId: string) {
    const { error } = await supabase.from('comments').update({ is_removed: true }).eq('id', commentId)
    if (error) throw error
  },

  async delete(commentId: string) {
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) throw error
  },
}

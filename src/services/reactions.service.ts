import { supabase } from '@/lib/supabase/client'

export type ReactionTypeDb = 'understand' | 'sending_support' | 'not_alone' | 'stay_strong' | 'thank_you'

export const reactionsService = {
  async listForStory(storyId: string) {
    const { data, error } = await supabase.from('reactions').select('*').eq('story_id', storyId)
    if (error) throw error
    return data
  },

  async add(storyId: string, userId: string, reactionType: ReactionTypeDb) {
    const { error } = await supabase
      .from('reactions')
      .insert({ story_id: storyId, user_id: userId, reaction_type: reactionType })
    if (error) throw error
  },

  async remove(storyId: string, userId: string, reactionType: ReactionTypeDb) {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .match({ story_id: storyId, user_id: userId, reaction_type: reactionType })
    if (error) throw error
  },
}

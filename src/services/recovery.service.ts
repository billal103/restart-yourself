import { supabase } from '@/lib/supabase/client'

export const recoveryService = {
  // Journal
  async listJournalEntries(userId: string) {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  async createJournalEntry(userId: string, title: string, content: string) {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ user_id: userId, title, content })
      .select()
      .single()
    if (error) throw error
    return data
  },
  async updateJournalEntry(id: string, title: string, content: string) {
    const { error } = await supabase.from('journal_entries').update({ title, content }).eq('id', id)
    if (error) throw error
  },
  async deleteJournalEntry(id: string) {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id)
    if (error) throw error
  },

  // Mood
  async listMoodEntries(userId: string) {
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: true })
    if (error) throw error
    return data
  },
  async upsertMoodEntry(userId: string, entryDate: string, level: number, note?: string) {
    const { error } = await supabase
      .from('mood_entries')
      .upsert({ user_id: userId, entry_date: entryDate, level, note }, { onConflict: 'user_id,entry_date' })
    if (error) throw error
  },

  // Recovery goals
  async listGoals(userId: string) {
    const { data, error } = await supabase
      .from('recovery_goals')
      .select('*, goal_milestones(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  async createGoal(userId: string, title: string, description?: string) {
    const { data, error } = await supabase
      .from('recovery_goals')
      .insert({ user_id: userId, title, description })
      .select()
      .single()
    if (error) throw error
    return data
  },
  async toggleMilestone(milestoneId: string, isComplete: boolean) {
    const { error } = await supabase.from('goal_milestones').update({ is_complete: isComplete }).eq('id', milestoneId)
    if (error) throw error
  },
}

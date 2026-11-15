import { supabase } from '@/lib/supabase/client'

export const profileService = {
  async updateDisplayName(userId: string, displayName: string) {
    const { error } = await supabase
      .from('anonymous_profiles')
      .update({ display_name: displayName })
      .eq('user_id', userId)
    if (error) throw error
  },

  async getPreferences(userId: string) {
    const { data, error } = await supabase.from('user_preferences').select('*').eq('user_id', userId).single()
    if (error) throw error
    return data
  },

  async updatePreferences(
    userId: string,
    prefs: Partial<{
      allow_messages: boolean
      allow_calls: boolean
      show_online_status: boolean
      ai_moderation_assist: boolean
    }>,
  ) {
    const { error } = await supabase.from('user_preferences').update(prefs).eq('user_id', userId)
    if (error) throw error
  },

  /**
   * Gathers every table where this user's own content lives — RLS already
   * scopes every one of these queries to rows they own, so this is a real
   * self-service export, not a placeholder. See docs/DATA_RETENTION_POLICY.md
   * for what's included and what (moderation/audit records) deliberately isn't.
   */
  async exportMyData(userId: string) {
    const [profile, preferences, stories, journalEntries, moodEntries, recoveryGoals] = await Promise.all([
      supabase.from('anonymous_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('stories').select('*').eq('author_id', userId),
      supabase.from('journal_entries').select('*').eq('user_id', userId),
      supabase.from('mood_entries').select('*').eq('user_id', userId),
      supabase.from('recovery_goals').select('*, goal_milestones(*)').eq('user_id', userId),
    ])
    for (const result of [profile, preferences, stories, journalEntries, moodEntries, recoveryGoals]) {
      if (result.error) throw result.error
    }
    return {
      exportedAt: new Date().toISOString(),
      profile: profile.data,
      preferences: preferences.data,
      stories: stories.data,
      journalEntries: journalEntries.data,
      moodEntries: moodEntries.data,
      recoveryGoals: recoveryGoals.data,
    }
  },

  /** Deletes the account entirely via a security-definer RPC — see migration 21. */
  async deleteOwnAccount() {
    const { error } = await supabase.rpc('request_account_deletion')
    if (error) throw error
  },
}

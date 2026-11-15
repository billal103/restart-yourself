import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import type { AppRole } from '@/lib/supabase/database.types'

export interface AuthProfile {
  userId: string
  email: string | null
  isAnonymous: boolean
  displayName: string
  avatarColor: string
  roles: AppRole[]
}

async function loadProfile(userId: string, email: string | null, isAnonymous: boolean): Promise<AuthProfile> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from('anonymous_profiles').select('display_name, avatar_color').eq('user_id', userId).single(),
    supabase.from('user_roles').select('role').eq('user_id', userId),
  ])

  return {
    userId,
    email,
    isAnonymous,
    displayName: profile?.display_name ?? 'Anonymous',
    avatarColor: profile?.avatar_color ?? '#6d4bd6',
    roles: (roles ?? []).map((r) => r.role),
  }
}

export const authService = {
  isConfigured: isSupabaseConfigured,

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    if (!data.session) return null
    return loadProfile(data.session.user.id, data.session.user.email ?? null, data.session.user.is_anonymous ?? false)
  },

  /**
   * Returns `null` when the project requires email confirmation and no
   * session exists yet — the caller should show a "check your email"
   * state rather than treat this as a logged-in user.
   */
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (!data.user) throw new Error('Sign up did not return a user')
    if (!data.session) return null
    return loadProfile(data.user.id, data.user.email ?? null, false)
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return loadProfile(data.user.id, data.user.email ?? null, false)
  },

  async signInAsGuest() {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    if (!data.user) throw new Error('Guest sign-in did not return a user')
    return loadProfile(data.user.id, null, true)
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },

  onAuthStateChange(callback: (profile: AuthProfile | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        callback(null)
        return
      }
      void loadProfile(session.user.id, session.user.email ?? null, session.user.is_anonymous ?? false).then(callback)
    })
  },
}

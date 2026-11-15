import { create } from 'zustand'
import type { AppRole } from '@/lib/supabase/database.types'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { AuthProfile } from '@/services/auth.service'
import { toast } from '@/stores/toastStore'
import type { CurrentUser, UserRole } from '@/types/domain'

const loadModerationService = () => import('@/services/moderation.service').then((m) => m.moderationService)

/**
 * Suspension (see 20260101000020_account_status_and_admin_stats.sql) isn't
 * enforced by RLS — a suspended user's existing session can still read/write
 * anything their role already allows. This is the frontend half: refuse to
 * complete sign-in for a suspended account. A real production deployment
 * would also want a Supabase Auth Hook rejecting the session server-side;
 * that requires a live project and isn't something this sandbox can set up.
 */
async function rejectIfSuspended(userId: string, authService: Awaited<ReturnType<typeof loadAuthService>>): Promise<void> {
  const moderationService = await loadModerationService()
  const status = await moderationService.checkOwnAccountStatus(userId)
  if (status === 'suspended') {
    await authService.signOut()
    throw new Error('This account has been suspended. Contact support if you believe this is a mistake.')
  }
}

// Loaded lazily so @supabase/supabase-js never ends up in the bundle every
// visitor downloads on first paint — only fetched once a real project is
// configured and one of these methods actually runs. See lib/supabase/env.ts.
const loadAuthService = () => import('@/services/auth.service').then((m) => m.authService)

interface AuthState {
  user: CurrentUser | null
  isAuthenticated: boolean
  isLoading: boolean
  /** Restores a real Supabase session on app load. No-op in mock mode. */
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  /** Returns true if the account needs email confirmation before it can log in. */
  register: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>
  loginAsGuest: () => Promise<void>
  logout: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  /**
   * Dev/demo convenience only: overrides the locally-displayed role so you
   * can preview role-gated UI (e.g. /admin). It never grants a real role —
   * that only happens server-side, via the user_roles table, by an admin.
   */
  setRole: (role: UserRole) => void
}

const mockRegisteredUser: CurrentUser = {
  id: 'user-1',
  anonymousDisplayName: 'HopefulHorizon482',
  email: 'demo@example.com',
  role: 'registered',
  isGuest: false,
  joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
}

const roleRank: AppRole[] = [
  'super_admin',
  'admin',
  'content_moderator',
  'group_moderator',
  'verified_professional',
  'supporter',
  'registered',
]

function profileToCurrentUser(profile: AuthProfile): CurrentUser {
  const highestRole = roleRank.find((r) => profile.roles.includes(r))
  return {
    id: profile.userId,
    anonymousDisplayName: profile.displayName,
    email: profile.email,
    role: profile.isAnonymous ? 'guest' : (highestRole ?? 'registered'),
    isGuest: profile.isAnonymous,
    joinedAt: new Date().toISOString(),
  }
}

async function withMockDelay<T>(value: T, ms = 400): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, ms))
  return value
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  initialize: async () => {
    if (!isSupabaseConfigured) return
    set({ isLoading: true })
    const authService = await loadAuthService()
    let profile = await authService.getSession()
    if (profile) {
      try {
        await rejectIfSuspended(profile.userId, authService)
      } catch {
        toast({ title: 'Signed out', description: 'This account has been suspended.', variant: 'error' })
        profile = null
      }
    }
    set({
      user: profile ? profileToCurrentUser(profile) : null,
      isAuthenticated: Boolean(profile),
      isLoading: false,
    })
    // Keeps state in sync with session changes this store didn't cause
    // itself — token refresh, expiry, or signing out in another tab.
    authService.onAuthStateChange((changedProfile) => {
      set({
        user: changedProfile ? profileToCurrentUser(changedProfile) : null,
        isAuthenticated: Boolean(changedProfile),
      })
    })
  },

  login: async (email, password) => {
    if (!isSupabaseConfigured) {
      const user = await withMockDelay({ ...mockRegisteredUser, email })
      set({ user, isAuthenticated: true })
      return
    }
    const authService = await loadAuthService()
    const profile = await authService.signIn(email, password)
    await rejectIfSuspended(profile.userId, authService)
    set({ user: profileToCurrentUser(profile), isAuthenticated: true })
  },

  register: async (email, password) => {
    if (!isSupabaseConfigured) {
      const user = await withMockDelay({ ...mockRegisteredUser, email })
      set({ user, isAuthenticated: true })
      return { requiresEmailConfirmation: false }
    }
    const authService = await loadAuthService()
    const profile = await authService.signUp(email, password)
    if (!profile) return { requiresEmailConfirmation: true }
    set({ user: profileToCurrentUser(profile), isAuthenticated: true })
    return { requiresEmailConfirmation: false }
  },

  loginAsGuest: async () => {
    if (!isSupabaseConfigured) {
      const user = await withMockDelay<CurrentUser>({
        id: 'guest-1',
        anonymousDisplayName: 'QuietRiver219',
        email: null,
        role: 'guest',
        isGuest: true,
        joinedAt: new Date().toISOString(),
      })
      set({ user, isAuthenticated: true })
      return
    }
    const authService = await loadAuthService()
    const profile = await authService.signInAsGuest()
    await rejectIfSuspended(profile.userId, authService)
    set({ user: profileToCurrentUser(profile), isAuthenticated: true })
  },

  logout: async () => {
    if (isSupabaseConfigured) await (await loadAuthService()).signOut()
    set({ user: null, isAuthenticated: false })
  },

  sendPasswordReset: async (email) => {
    if (!isSupabaseConfigured) {
      await withMockDelay(undefined)
      return
    }
    await (await loadAuthService()).sendPasswordReset(email)
  },

  updatePassword: async (newPassword) => {
    if (!isSupabaseConfigured) {
      await withMockDelay(undefined)
      return
    }
    await (await loadAuthService()).updatePassword(newPassword)
  },

  setRole: (role) => set((state) => (state.user ? { user: { ...state.user, role } } : state)),
}))

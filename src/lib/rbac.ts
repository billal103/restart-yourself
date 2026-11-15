import type { CurrentUser } from '@/types/domain'

// Mirrors the server-side is_admin()/is_moderator() helpers in
// supabase/migrations/20260101000002_users_and_roles.sql. This is a UI
// convenience only — hiding admin-only controls from a plain moderator — not
// a security boundary; RLS is what actually enforces these on every write.
export function isAdmin(user: CurrentUser | null): boolean {
  return user?.role === 'admin' || user?.role === 'super_admin'
}

export function isModerator(user: CurrentUser | null): boolean {
  return isAdmin(user) || user?.role === 'content_moderator' || user?.role === 'group_moderator'
}

import { supabase } from '@/lib/supabase/client'
import type { AccountStatusDb, AppRole } from '@/lib/supabase/database.types'
import type { AdminStats, AdminUserRow, AuditLogEntry, Comment, CommunicationReportItem, ReportedComment, UserRole } from '@/types/domain'

// Same ladder authStore.ts uses to pick a single display role out of
// possibly-several user_roles rows. Duplicated rather than imported from the
// store to keep this service free of any Zustand/store dependency.
const roleRank: AppRole[] = [
  'super_admin',
  'admin',
  'content_moderator',
  'group_moderator',
  'verified_professional',
  'supporter',
  'registered',
]

function highestRole(roles: AppRole[]): UserRole {
  return roleRank.find((r) => roles.includes(r)) ?? 'registered'
}

async function fetchDisplayNames(userIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(userIds)]
  if (unique.length === 0) return new Map()
  const { data, error } = await supabase.from('anonymous_profiles').select('user_id, display_name').in('user_id', unique)
  if (error) throw error
  return new Map((data ?? []).map((row) => [row.user_id, row.display_name]))
}

export const moderationService = {
  async getAdminStats(): Promise<AdminStats> {
    const { data, error } = await supabase.rpc('get_admin_stats')
    if (error) throw error
    const row = data?.[0]
    return {
      registeredUsers: row?.registered_users ?? 0,
      guestUsers: row?.guest_users ?? 0,
      totalStories: row?.total_stories ?? 0,
      publishedStories: row?.published_stories ?? 0,
      pendingStories: row?.pending_stories ?? 0,
      reportedStories: row?.reported_stories ?? 0,
      totalComments: row?.total_comments ?? 0,
      activeCommunities: row?.active_communities ?? 0,
      messageReports: row?.message_reports ?? 0,
      moderationActionsToday: row?.moderation_actions_today ?? 0,
    }
  },

  async listAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    const rows = data ?? []
    const namesByActor = await fetchDisplayNames(rows.map((r) => r.actor_id).filter((id): id is string => Boolean(id)))
    return rows.map((row) => ({
      id: row.id,
      actor: row.actor_id ? namesByActor.get(row.actor_id) ?? 'Unknown member' : 'System',
      action: row.action.replace(/_/g, ' '),
      target: row.target ?? '',
      createdAt: row.created_at,
    }))
  },

  async recordAction(targetType: string, targetId: string, action: string, notes?: string | null) {
    const { error } = await supabase.rpc('record_moderation_action', {
      p_target_type: targetType,
      p_target_id: targetId,
      p_action: action,
      p_notes: notes ?? null,
    })
    if (error) throw error
  },

  async approveStory(storyId: string, notes?: string | null) {
    const { error } = await supabase.from('stories').update({ status: 'published' }).eq('id', storyId)
    if (error) throw error
    await moderationService.recordAction('story', storyId, 'approve_story', notes)
  },

  async rejectStory(storyId: string, notes?: string | null) {
    const { error } = await supabase.from('stories').update({ status: 'rejected' }).eq('id', storyId)
    if (error) throw error
    await moderationService.recordAction('story', storyId, 'reject_story', notes)
  },

  async listReportedComments(): Promise<ReportedComment[]> {
    const { data: reportRows, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('target_type', 'comment')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    if (reportError) throw reportError
    if (!reportRows || reportRows.length === 0) return []

    const commentIds = reportRows.map((r) => r.target_id)
    const { data: commentRows, error: commentError } = await supabase
      .from('comments')
      .select('*, anonymous_profiles!comments_author_id_profile_fkey(display_name, avatar_color, is_verified_professional)')
      .in('id', commentIds)
    if (commentError) throw commentError

    const reporterIds = reportRows.map((r) => r.reporter_id).filter((id): id is string => Boolean(id))
    const reporterNames = await fetchDisplayNames(reporterIds)

    const commentsById = new Map((commentRows ?? []).map((c) => [c.id, c]))

    return reportRows
      .map((report): ReportedComment | null => {
        const comment = commentsById.get(report.target_id)
        if (!comment) return null
        const profile = Array.isArray(comment.anonymous_profiles) ? comment.anonymous_profiles[0] : comment.anonymous_profiles
        const hydratedComment: Comment = {
          id: comment.id,
          storyId: comment.story_id,
          content: comment.content,
          createdAt: comment.created_at,
          parentId: comment.parent_id,
          replies: [],
          author: {
            anonymousId: comment.author_id,
            displayName: profile?.display_name ?? 'Anonymous',
            avatarColor: profile?.avatar_color ?? '#6d4bd6',
            isVerifiedProfessional: profile?.is_verified_professional ?? false,
          },
        }
        return {
          reportId: report.id,
          reason: report.reason,
          reporterName: report.reporter_id ? reporterNames.get(report.reporter_id) ?? 'Unknown member' : 'Unknown member',
          comment: hydratedComment,
        }
      })
      .filter((r): r is ReportedComment => r !== null)
  },

  async removeReportedComment(reportId: string, commentId: string, moderatorId: string, notes?: string | null) {
    const { error: commentError } = await supabase.from('comments').update({ is_removed: true }).eq('id', commentId)
    if (commentError) throw commentError
    const { error: reportError } = await supabase
      .from('reports')
      .update({ status: 'resolved', resolved_by: moderatorId, resolved_at: new Date().toISOString() })
      .eq('id', reportId)
    if (reportError) throw reportError
    await moderationService.recordAction('comment', commentId, 'remove_comment', notes)
  },

  async listCommunicationReports(targetTypes: ('message' | 'conversation' | 'call' | 'group_message')[]): Promise<CommunicationReportItem[]> {
    const { data, error } = await supabase
      .from('communication_reports')
      .select('*')
      .in('target_type', targetTypes)
      .order('created_at', { ascending: false })
    if (error) throw error
    const rows = data ?? []
    const reporterNames = await fetchDisplayNames(rows.map((r) => r.reporter_id).filter((id): id is string => Boolean(id)))
    return rows.map((row) => ({
      id: row.id,
      targetType: row.target_type,
      targetId: row.target_id,
      reason: row.reason,
      status: row.status,
      reporterName: row.reporter_id ? reporterNames.get(row.reporter_id) ?? 'Unknown member' : 'Unknown member',
      createdAt: row.created_at,
    }))
  },

  async resolveCommunicationReport(
    reportId: string,
    targetType: 'message' | 'conversation' | 'call' | 'group_message',
    targetId: string,
    notes?: string | null,
  ) {
    const { error } = await supabase.from('communication_reports').update({ status: 'resolved' }).eq('id', reportId)
    if (error) throw error
    await moderationService.recordAction(targetType, targetId, 'resolve_communication_report', notes)
  },

  async listUsers(): Promise<AdminUserRow[]> {
    const [{ data: profiles, error: profileError }, { data: roleRows, error: roleError }, { data: statusRows, error: statusError }] =
      await Promise.all([
        supabase.from('anonymous_profiles').select('user_id, display_name, created_at').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('user_account_status').select('user_id, status'),
      ])
    if (profileError) throw profileError
    if (roleError) throw roleError
    if (statusError) throw statusError

    const rolesByUser = new Map<string, AppRole[]>()
    for (const row of roleRows ?? []) {
      const list = rolesByUser.get(row.user_id) ?? []
      list.push(row.role)
      rolesByUser.set(row.user_id, list)
    }
    const statusByUser = new Map((statusRows ?? []).map((row) => [row.user_id, row.status]))

    return (profiles ?? []).map((profile) => {
      const roles = rolesByUser.get(profile.user_id) ?? []
      return {
        id: profile.user_id,
        displayName: profile.display_name,
        // The anon/authenticated client can only query the public schema;
        // auth.users (which holds email) is never exposed to it, by design,
        // and there's no live Supabase project here to add a service-role
        // Edge Function for this. See docs/SECURITY.md.
        email: null,
        role: roles.length > 0 ? highestRole(roles) : 'guest',
        roles,
        status: (statusByUser.get(profile.user_id) ?? 'active') as AdminUserRow['status'],
        joinedAt: profile.created_at,
      }
    })
  },

  async setUserRole(userId: string, role: AppRole, grant: boolean) {
    if (grant) {
      const { error } = await supabase.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id,role' })
      if (error) throw error
    } else {
      const { error } = await supabase.from('user_roles').delete().match({ user_id: userId, role })
      if (error) throw error
    }
    await moderationService.recordAction('user', userId, `${grant ? 'grant_role' : 'revoke_role'}:${role}`)
  },

  async setUserStatus(userId: string, status: AccountStatusDb, notes?: string | null) {
    const { error } = await supabase.rpc('set_user_account_status', {
      p_user_id: userId,
      p_status: status,
      p_notes: notes ?? null,
    })
    if (error) throw error
  },

  /**
   * Called right after a real sign-in resolves. Suspension isn't enforced by
   * RLS (see the migration's comment) — this is the frontend half of that
   * enforcement: if the account is suspended, sign it back out immediately.
   */
  async checkOwnAccountStatus(userId: string): Promise<AccountStatusDb> {
    const { data, error } = await supabase.from('user_account_status').select('status').eq('user_id', userId).maybeSingle()
    if (error) throw error
    return data?.status ?? 'active'
  },

  async listCategoriesWithCounts() {
    const [{ data: categories, error: categoryError }, { data: storyRows, error: storyError }] = await Promise.all([
      supabase.from('categories').select('*').order('name', { ascending: true }),
      supabase.from('stories').select('category_id'),
    ])
    if (categoryError) throw categoryError
    if (storyError) throw storyError
    const counts = new Map<string, number>()
    for (const row of storyRows ?? []) {
      if (!row.category_id) continue
      counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1)
    }
    return (categories ?? []).map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description ?? '',
      icon: category.icon ?? 'Heart',
      storyCount: counts.get(category.id) ?? 0,
    }))
  },

  async createCategory(input: { slug: string; name: string; description?: string | null; icon?: string | null }) {
    const { error } = await supabase.from('categories').insert(input)
    if (error) throw error
  },

  async updateCategory(id: string, input: { slug?: string; name?: string; description?: string | null; icon?: string | null }) {
    const { error } = await supabase.from('categories').update(input).eq('id', id)
    if (error) throw error
  },

  async deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
  },
}

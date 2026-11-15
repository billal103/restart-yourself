export interface AdminStats {
  registeredUsers: number
  guestUsers: number
  totalStories: number
  publishedStories: number
  pendingStories: number
  reportedStories: number
  totalComments: number
  activeCommunities: number
  messageReports: number
  moderationActionsToday: number
}

// Demo statistics only — not connected to a live database in Milestone 1.
export const adminStats: AdminStats = {
  registeredUsers: 4821,
  guestUsers: 1209,
  totalStories: 2043,
  publishedStories: 1876,
  pendingStories: 52,
  reportedStories: 18,
  totalComments: 9312,
  activeCommunities: 7,
  messageReports: 6,
  moderationActionsToday: 14,
}

export interface AuditLogEntry {
  id: string
  actor: string
  action: string
  target: string
  createdAt: string
}

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

export const auditLogs: AuditLogEntry[] = [
  {
    id: 'audit-1',
    actor: 'Moderator Jamie',
    action: 'Removed story',
    target: 'story-42',
    createdAt: hoursAgoIso(2),
  },
  {
    id: 'audit-2',
    actor: 'Admin Priya',
    action: 'Verified professional',
    target: 'pro-2',
    createdAt: hoursAgoIso(6),
  },
  {
    id: 'audit-3',
    actor: 'Moderator Jamie',
    action: 'Suspended user',
    target: 'user-918',
    createdAt: hoursAgoIso(26),
  },
]

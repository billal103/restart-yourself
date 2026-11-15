// Shared domain types. Shapes mirror the planned Supabase schema (Milestone 2)
// so services can be swapped from mock data to real queries without page rewrites.

export type StoryStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'archived'

export interface Category {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  storyCount: number
}

export interface Tag {
  id: string
  slug: string
  name: string
}

export type ReactionType =
  | 'understand'
  | 'sending_support'
  | 'not_alone'
  | 'stay_strong'
  | 'thank_you'

export interface AnonymousAuthor {
  anonymousId: string
  displayName: string
  avatarColor: string
  isVerifiedProfessional: boolean
}

export interface Story {
  id: string
  title: string
  content: string
  excerpt: string
  author: AnonymousAuthor
  category: Category
  tags: Tag[]
  status: StoryStatus
  contentWarnings: string[]
  publishedAt: string | null
  createdAt: string
  reactionCounts: Record<ReactionType, number>
  commentCount: number
  bookmarked: boolean
}

export interface Comment {
  id: string
  storyId: string
  author: AnonymousAuthor
  content: string
  createdAt: string
  parentId: string | null
  replies: Comment[]
}

export interface Conversation {
  id: string
  participant: AnonymousAuthor
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  isRequest: boolean
  isBlocked: boolean
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  sentAt: string
  readAt: string | null
}

export interface Group {
  id: string
  slug: string
  name: string
  description: string
  memberCount: number
  guidelines: string
  isMember: boolean
}

export interface GroupMessage {
  id: string
  groupId: string
  author: AnonymousAuthor
  content: string
  sentAt: string
}

export type MoodLevel = 1 | 2 | 3 | 4 | 5

export interface MoodEntry {
  id: string
  date: string
  level: MoodLevel
  note: string
}

export interface JournalEntry {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface GoalMilestone {
  id: string
  title: string
  isComplete: boolean
}

export interface RecoveryGoal {
  id: string
  title: string
  description: string
  createdAt: string
  targetDate: string | null
  isComplete: boolean
  milestones: GoalMilestone[]
}

export interface Professional {
  id: string
  name: string
  title: string
  specializations: string[]
  verificationStatus: 'verified' | 'pending' | 'unverified'
  bio: string
  contactUrl: string | null
}

export interface Resource {
  id: string
  title: string
  description: string
  category: string
  url: string
  region: string
}

export interface NotificationItem {
  id: string
  type:
    | 'message_request'
    | 'message'
    | 'comment'
    | 'reply'
    | 'reaction'
    | 'group_discussion'
    | 'call_request'
    | 'moderation'
    | 'recovery_reminder'
  title: string
  body: string
  createdAt: string
  isRead: boolean
}

export type UserRole =
  | 'guest'
  | 'registered'
  | 'supporter'
  | 'group_moderator'
  | 'content_moderator'
  | 'verified_professional'
  | 'admin'
  | 'super_admin'

export interface CurrentUser {
  id: string
  anonymousDisplayName: string
  email: string | null
  role: UserRole
  isGuest: boolean
  joinedAt: string
}

export type AccountStatus = 'active' | 'restricted' | 'suspended'

export interface AdminUserRow {
  id: string
  displayName: string
  email: string | null
  role: UserRole
  /** Every role row this user actually holds — a user can hold more than one at once. */
  roles: Exclude<UserRole, 'guest'>[]
  status: AccountStatus
  joinedAt: string
}

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

export interface AuditLogEntry {
  id: string
  actor: string
  action: string
  target: string
  createdAt: string
}

export interface CommunicationReportItem {
  id: string
  targetType: 'message' | 'conversation' | 'call' | 'group_message'
  targetId: string
  reason: string
  status: 'open' | 'resolved'
  reporterName: string
  createdAt: string
}

export interface ReportedComment {
  reportId: string
  comment: Comment
  reason: string
  reporterName: string
}

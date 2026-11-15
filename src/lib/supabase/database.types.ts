// Hand-written types matching supabase/migrations/. Once a real Supabase
// project exists, replace this file with the output of:
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
// (or --local, once a Docker-backed local stack is running).

export type AppRole =
  | 'registered'
  | 'supporter'
  | 'group_moderator'
  | 'content_moderator'
  | 'verified_professional'
  | 'admin'
  | 'super_admin'

export type StoryStatusDb = 'draft' | 'pending' | 'published' | 'rejected' | 'archived'
export type ReactionTypeDb = 'understand' | 'sending_support' | 'not_alone' | 'stay_strong' | 'thank_you'
export type ConversationStatusDb = 'pending' | 'active' | 'declined'
export type CallTypeDb = 'voice' | 'video'
export type CallStatusDb = 'ringing' | 'active' | 'ended' | 'missed' | 'declined'
export type VerificationStatusDb = 'unverified' | 'pending' | 'verified'
export type AccountStatusDb = 'active' | 'restricted' | 'suspended'
export type NotificationTypeDb =
  | 'message_request'
  | 'message'
  | 'comment'
  | 'reply'
  | 'reaction'
  | 'group_discussion'
  | 'call_request'
  | 'moderation'
  | 'recovery_reminder'

// Helper: a table whose Insert and Update are just "some/all columns of Row".
interface SimpleTable<Row, RequiredInsertKeys extends keyof Row> {
  Row: Row
  Insert: Partial<Row> & Pick<Row, RequiredInsertKeys>
  Update: Partial<Row>
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      anonymous_profiles: SimpleTable<
        {
          id: string
          user_id: string
          display_name: string
          avatar_color: string
          is_verified_professional: boolean
          created_at: string
        },
        'user_id' | 'display_name'
      >
      user_roles: SimpleTable<
        { user_id: string; role: AppRole; granted_at: string; granted_by: string | null },
        'user_id' | 'role'
      >
      user_preferences: SimpleTable<
        {
          user_id: string
          allow_messages: boolean
          allow_calls: boolean
          show_online_status: boolean
          ai_moderation_assist: boolean
          language: string
          updated_at: string
        },
        'user_id'
      >
      categories: SimpleTable<
        { id: string; slug: string; name: string; description: string | null; icon: string | null; created_at: string },
        'slug' | 'name'
      >
      tags: SimpleTable<{ id: string; slug: string; name: string }, 'slug' | 'name'>
      stories: {
        Row: {
          id: string
          author_id: string
          category_id: string | null
          title: string
          content: string
          excerpt: string | null
          status: StoryStatusDb
          content_warnings: string[]
          publish_anonymously: boolean
          is_guest_authored: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          category_id?: string | null
          title: string
          content: string
          excerpt?: string | null
          status?: StoryStatusDb
          content_warnings?: string[]
          publish_anonymously?: boolean
          is_guest_authored?: boolean
        }
        Update: Partial<Database['public']['Tables']['stories']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'stories_category_id_fkey'
            columns: ['category_id']
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'stories_author_id_profile_fkey'
            columns: ['author_id']
            referencedRelation: 'anonymous_profiles'
            referencedColumns: ['user_id']
          },
        ]
      }
      story_tags: SimpleTable<{ story_id: string; tag_id: string }, 'story_id' | 'tag_id'>
      story_media: SimpleTable<
        { id: string; story_id: string; storage_path: string; media_type: string; created_at: string },
        'story_id' | 'storage_path' | 'media_type'
      >
      story_revisions: SimpleTable<
        { id: string; story_id: string; title: string; content: string; edited_by: string | null; created_at: string },
        'story_id' | 'title' | 'content'
      >
      reactions: SimpleTable<
        { id: string; story_id: string; user_id: string; reaction_type: ReactionTypeDb; created_at: string },
        'story_id' | 'user_id' | 'reaction_type'
      >
      comments: {
        Row: {
          id: string
          story_id: string
          author_id: string
          parent_id: string | null
          content: string
          is_removed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          story_id: string
          author_id: string
          parent_id?: string | null
          content: string
          is_removed?: boolean
        }
        Update: Partial<Database['public']['Tables']['comments']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'comments_author_id_profile_fkey'
            columns: ['author_id']
            referencedRelation: 'anonymous_profiles'
            referencedColumns: ['user_id']
          },
        ]
      }
      bookmarks: SimpleTable<{ user_id: string; story_id: string; created_at: string }, 'user_id' | 'story_id'>
      blocks: SimpleTable<{ blocker_id: string; blocked_id: string; created_at: string }, 'blocker_id' | 'blocked_id'>
      reports: SimpleTable<
        {
          id: string
          reporter_id: string | null
          target_type: 'story' | 'comment'
          target_id: string
          reason: string
          status: 'open' | 'resolved' | 'dismissed'
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
        },
        'target_type' | 'target_id' | 'reason'
      >
      conversations: SimpleTable<
        { id: string; initiated_by: string; status: ConversationStatusDb; created_at: string },
        'initiated_by'
      >
      conversation_members: {
        Row: {
          conversation_id: string
          user_id: string
          is_hidden: boolean
          last_read_at: string | null
          joined_at: string
        }
        Insert: {
          conversation_id: string
          user_id: string
          is_hidden?: boolean
          last_read_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['conversation_members']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'conversation_members_user_id_profile_fkey'
            columns: ['user_id']
            referencedRelation: 'anonymous_profiles'
            referencedColumns: ['user_id']
          },
        ]
      }
      messages: SimpleTable<
        { id: string; conversation_id: string; sender_id: string; content: string; created_at: string; read_at: string | null },
        'conversation_id' | 'sender_id' | 'content'
      >
      message_attachments: SimpleTable<
        { id: string; message_id: string; storage_path: string; content_type: string; created_at: string },
        'message_id' | 'storage_path' | 'content_type'
      >
      call_sessions: SimpleTable<
        {
          id: string
          conversation_id: string
          caller_id: string
          type: CallTypeDb
          status: CallStatusDb
          started_at: string
          connected_at: string | null
          ended_at: string | null
        },
        'conversation_id' | 'caller_id' | 'type'
      >
      call_participants: SimpleTable<
        { call_id: string; user_id: string; joined_at: string | null; left_at: string | null },
        'call_id' | 'user_id'
      >
      call_signals: SimpleTable<
        {
          id: string
          call_id: string
          sender_id: string
          signal_type: 'offer' | 'answer' | 'ice-candidate'
          payload: unknown
          created_at: string
        },
        'call_id' | 'sender_id' | 'signal_type' | 'payload'
      >
      communities: SimpleTable<
        {
          id: string
          slug: string
          name: string
          description: string | null
          guidelines: string | null
          created_by: string | null
          created_at: string
        },
        'slug' | 'name'
      >
      community_members: {
        Row: { community_id: string; user_id: string; role: 'member' | 'moderator'; joined_at: string }
        Insert: Partial<Database['public']['Tables']['community_members']['Row']> & {
          community_id: string
          user_id: string
        }
        Update: Partial<Database['public']['Tables']['community_members']['Row']>
        Relationships: [
          {
            foreignKeyName: 'community_members_user_id_profile_fkey'
            columns: ['user_id']
            referencedRelation: 'anonymous_profiles'
            referencedColumns: ['user_id']
          },
        ]
      }
      group_chat_rooms: SimpleTable<{ id: string; community_id: string; created_at: string }, 'community_id'>
      group_messages: {
        Row: {
          id: string
          room_id: string
          author_id: string
          content: string
          is_removed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          author_id: string
          content: string
          is_removed?: boolean
        }
        Update: Partial<Database['public']['Tables']['group_messages']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'group_messages_author_id_profile_fkey'
            columns: ['author_id']
            referencedRelation: 'anonymous_profiles'
            referencedColumns: ['user_id']
          },
        ]
      }
      discussions: SimpleTable<
        { id: string; community_id: string; author_id: string; title: string; content: string; created_at: string },
        'community_id' | 'author_id' | 'title' | 'content'
      >
      discussion_comments: SimpleTable<
        { id: string; discussion_id: string; author_id: string; content: string; created_at: string },
        'discussion_id' | 'author_id' | 'content'
      >
      journal_entries: SimpleTable<
        { id: string; user_id: string; title: string; content: string; created_at: string; updated_at: string },
        'user_id' | 'title' | 'content'
      >
      mood_entries: SimpleTable<
        { id: string; user_id: string; entry_date: string; level: number; note: string | null; created_at: string },
        'user_id' | 'entry_date' | 'level'
      >
      recovery_goals: SimpleTable<
        {
          id: string
          user_id: string
          title: string
          description: string | null
          target_date: string | null
          is_complete: boolean
          created_at: string
        },
        'user_id' | 'title'
      >
      goal_milestones: {
        Row: { id: string; goal_id: string; title: string; is_complete: boolean; position: number }
        Insert: Partial<Database['public']['Tables']['goal_milestones']['Row']> & { goal_id: string; title: string }
        Update: Partial<Database['public']['Tables']['goal_milestones']['Row']>
        Relationships: [
          {
            foreignKeyName: 'goal_milestones_goal_id_fkey'
            columns: ['goal_id']
            referencedRelation: 'recovery_goals'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: SimpleTable<
        {
          id: string
          user_id: string
          type: NotificationTypeDb
          title: string
          body: string
          is_read: boolean
          created_at: string
        },
        'user_id' | 'type' | 'title' | 'body'
      >
      notification_preferences: SimpleTable<
        {
          user_id: string
          messages: boolean
          reactions: boolean
          groups: boolean
          calls: boolean
          recovery: boolean
          updated_at: string
        },
        'user_id'
      >
      moderation_actions: SimpleTable<
        {
          id: string
          moderator_id: string
          target_type: string
          target_id: string
          action: string
          notes: string | null
          created_at: string
        },
        'moderator_id' | 'target_type' | 'target_id' | 'action'
      >
      audit_logs: SimpleTable<
        { id: string; actor_id: string | null; action: string; target: string | null; created_at: string },
        'action'
      >
      communication_reports: SimpleTable<
        {
          id: string
          reporter_id: string | null
          target_type: 'message' | 'conversation' | 'call' | 'group_message'
          target_id: string
          reason: string
          status: 'open' | 'resolved'
          created_at: string
        },
        'target_type' | 'target_id' | 'reason'
      >
      crisis_events: SimpleTable<
        {
          id: string
          story_id: string | null
          reported_by: string | null
          status: 'flagged' | 'reviewed' | 'escalated' | 'closed'
          notes: string | null
          created_at: string
        },
        never
      >
      professionals: SimpleTable<
        {
          id: string
          user_id: string | null
          name: string
          title: string
          bio: string | null
          specializations: string[]
          contact_url: string | null
          verification_status: VerificationStatusDb
          created_at: string
        },
        'name' | 'title'
      >
      professional_verifications: SimpleTable<
        {
          id: string
          professional_id: string
          reviewed_by: string | null
          document_storage_path: string | null
          status: VerificationStatusDb
          notes: string | null
          reviewed_at: string | null
          created_at: string
        },
        'professional_id'
      >
      resources: SimpleTable<
        { id: string; title: string; description: string | null; category: string; url: string; region: string; created_at: string },
        'title' | 'category' | 'url'
      >
      guest_publish_tokens: SimpleTable<
        { id: string; story_id: string; token_hash: string; created_at: string },
        'story_id' | 'token_hash'
      >
      user_account_status: SimpleTable<
        {
          user_id: string
          status: AccountStatusDb
          notes: string | null
          updated_by: string | null
          updated_at: string
        },
        'user_id'
      >
    }
    Views: Record<string, never>
    Functions: {
      issue_guest_token: { Args: { p_story_id: string }; Returns: string }
      claim_guest_story: { Args: { p_story_id: string; p_token: string }; Returns: boolean }
      start_conversation: { Args: { p_recipient_id: string; p_first_message: string }; Returns: string }
      respond_to_message_request: { Args: { p_conversation_id: string; p_accept: boolean }; Returns: undefined }
      send_message: { Args: { p_conversation_id: string; p_content: string }; Returns: string }
      start_call: { Args: { p_conversation_id: string; p_type: CallTypeDb }; Returns: string }
      record_moderation_action: {
        Args: { p_target_type: string; p_target_id: string; p_action: string; p_notes?: string | null }
        Returns: string
      }
      set_user_account_status: {
        Args: { p_user_id: string; p_status: AccountStatusDb; p_notes?: string | null }
        Returns: undefined
      }
      request_account_deletion: { Args: Record<string, never>; Returns: undefined }
      get_admin_stats: {
        Args: Record<string, never>
        Returns: {
          registered_users: number
          guest_users: number
          total_stories: number
          published_stories: number
          pending_stories: number
          reported_stories: number
          total_comments: number
          active_communities: number
          message_reports: number
          moderation_actions_today: number
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

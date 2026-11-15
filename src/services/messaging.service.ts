import { supabase } from '@/lib/supabase/client'

export const messagingService = {
  async getOtherParticipant(conversationId: string, myUserId: string) {
    const { data, error } = await supabase
      .from('conversation_members')
      .select('user_id, anonymous_profiles!conversation_members_user_id_profile_fkey(display_name, avatar_color, is_verified_professional)')
      .eq('conversation_id', conversationId)
      .neq('user_id', myUserId)
      .single()
    if (error) throw error
    return data
  },

  async listConversations(userId: string) {
    const { data, error } = await supabase
      .from('conversation_members')
      .select('conversation_id, conversations(id, status, initiated_by, created_at)')
      .eq('user_id', userId)
    if (error) throw error
    return data
  },

  /**
   * One row per conversation the user belongs to, with the other
   * participant's profile and the most recent message. A few queries
   * rather than one clever join — fine at this scale, and far easier to
   * read than a single deeply nested PostgREST embed.
   */
  async listConversationSummaries(userId: string) {
    const { data: memberRows, error: memberError } = await supabase
      .from('conversation_members')
      .select('conversation_id, conversations(id, status, initiated_by, created_at)')
      .eq('user_id', userId)
    if (memberError) throw memberError

    const summaries = await Promise.all(
      (memberRows ?? []).map(async (row) => {
        const conversation = Array.isArray(row.conversations) ? row.conversations[0] : row.conversations
        if (!conversation) return null

        const [other, { data: lastMessage }] = await Promise.all([
          this.getOtherParticipant(conversation.id, userId).catch(() => null),
          supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])

        const profile = other
          ? Array.isArray(other.anonymous_profiles)
            ? other.anonymous_profiles[0]
            : other.anonymous_profiles
          : null

        return {
          conversationId: conversation.id,
          isRequest: conversation.status === 'pending' && conversation.initiated_by !== userId,
          isPendingMine: conversation.status === 'pending' && conversation.initiated_by === userId,
          otherUserId: other?.user_id ?? null,
          displayName: profile?.display_name ?? 'Anonymous',
          avatarColor: profile?.avatar_color ?? '#6d4bd6',
          lastMessage: lastMessage?.content ?? '',
          lastMessageAt: lastMessage?.created_at ?? conversation.created_at,
        }
      }),
    )

    return summaries.filter((s): s is NonNullable<typeof s> => s !== null)
  },

  async listMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  async startConversation(recipientId: string, firstMessage: string) {
    const { data, error } = await supabase.rpc('start_conversation', {
      p_recipient_id: recipientId,
      p_first_message: firstMessage,
    })
    if (error) throw error
    return data
  },

  async respondToRequest(conversationId: string, accept: boolean) {
    const { error } = await supabase.rpc('respond_to_message_request', {
      p_conversation_id: conversationId,
      p_accept: accept,
    })
    if (error) throw error
  },

  async sendMessage(conversationId: string, content: string) {
    const { data, error } = await supabase.rpc('send_message', {
      p_conversation_id: conversationId,
      p_content: content,
    })
    if (error) throw error
    return data
  },

  async markRead(messageIds: string[]) {
    if (messageIds.length === 0) return
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds)
    if (error) throw error
  },

  /** Live updates for a single conversation's messages. Returns an unsubscribe function. */
  subscribeToMessages(conversationId: string, onInsert: (message: { id: string }) => void) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => onInsert(payload.new as { id: string }),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  },
}

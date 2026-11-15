import { supabase } from '@/lib/supabase/client'

export const groupsService = {
  async listCommunities() {
    const { data, error } = await supabase.from('communities').select('*')
    if (error) throw error
    return data
  },

  async getCommunity(communityId: string) {
    const { data, error } = await supabase.from('communities').select('*').eq('id', communityId).single()
    if (error) throw error
    return data
  },

  async getMemberCount(communityId: string) {
    const { count, error } = await supabase
      .from('community_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('community_id', communityId)
    if (error) throw error
    return count ?? 0
  },

  async isMember(communityId: string, userId: string) {
    const { data, error } = await supabase
      .from('community_members')
      .select('user_id')
      .match({ community_id: communityId, user_id: userId })
      .maybeSingle()
    if (error) throw error
    return Boolean(data)
  },

  /** Communities with a member count and whether the given user has joined. */
  async listWithMembership(userId: string | null) {
    const [{ data: communities, error }, { data: allMembers, error: memberError }] = await Promise.all([
      supabase.from('communities').select('*'),
      supabase.from('community_members').select('community_id, user_id'),
    ])
    if (error) throw error
    if (memberError) throw memberError

    return (communities ?? []).map((community) => {
      const members = (allMembers ?? []).filter((m) => m.community_id === community.id)
      return {
        ...community,
        memberCount: members.length,
        isMember: userId ? members.some((m) => m.user_id === userId) : false,
      }
    })
  },

  async listMyMemberships(userId: string) {
    const { data, error } = await supabase.from('community_members').select('community_id').eq('user_id', userId)
    if (error) throw error
    return data
  },

  async join(communityId: string, userId: string) {
    const { error } = await supabase.from('community_members').insert({ community_id: communityId, user_id: userId })
    if (error) throw error
  },

  async leave(communityId: string, userId: string) {
    const { error } = await supabase
      .from('community_members')
      .delete()
      .match({ community_id: communityId, user_id: userId })
    if (error) throw error
  },

  async listMembers(communityId: string) {
    const { data, error } = await supabase
      .from('community_members')
      .select('user_id, anonymous_profiles!community_members_user_id_profile_fkey(display_name, avatar_color)')
      .eq('community_id', communityId)
    if (error) throw error
    return data
  },

  async getChatRoomId(communityId: string) {
    const { data, error } = await supabase
      .from('group_chat_rooms')
      .select('id')
      .eq('community_id', communityId)
      .single()
    if (error) throw error
    return data.id as string
  },

  async listMessages(roomId: string) {
    const { data, error } = await supabase
      .from('group_messages')
      .select('*, anonymous_profiles!group_messages_author_id_profile_fkey(display_name, avatar_color)')
      .eq('room_id', roomId)
      .eq('is_removed', false)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  async sendMessage(roomId: string, authorId: string, content: string) {
    const { error } = await supabase.from('group_messages').insert({ room_id: roomId, author_id: authorId, content })
    if (error) throw error
  },

  subscribeToMessages(roomId: string, onInsert: (message: { id: string }) => void) {
    const channel = supabase
      .channel(`group-messages:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `room_id=eq.${roomId}` },
        (payload) => onInsert(payload.new as { id: string }),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  },
}

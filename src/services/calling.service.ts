import { supabase } from '@/lib/supabase/client'

export type SignalType = 'offer' | 'answer' | 'ice-candidate'

export interface CallSignalRow {
  id: string
  call_id: string
  sender_id: string
  signal_type: SignalType
  payload: unknown
  created_at: string
}

/**
 * Free public STUN only. STUN is enough to discover a usable public
 * address/port for most home and mobile networks, but it cannot relay
 * media when both peers sit behind a symmetric/restrictive NAT or
 * corporate firewall — that needs a TURN server. This project does not
 * run one: Twilio, Cloudflare, and Xirsys all offer pay-as-you-go TURN
 * if call reliability in production turns out to need it. Until then,
 * some fraction of calls between restrictive networks will fail to
 * connect, and the UI should treat that as an expected, explainable
 * outcome rather than a bug.
 */
export const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]

export const callingService = {
  async getCallerProfile(callerId: string) {
    const { data, error } = await supabase
      .from('anonymous_profiles')
      .select('display_name, avatar_color')
      .eq('user_id', callerId)
      .single()
    if (error) throw error
    return data
  },

  async startCall(conversationId: string, type: 'voice' | 'video') {
    const { data, error } = await supabase.rpc('start_call', {
      p_conversation_id: conversationId,
      p_type: type,
    })
    if (error) throw error
    return data as string
  },

  async joinCall(callId: string, userId: string) {
    const { error } = await supabase
      .from('call_participants')
      .insert({ call_id: callId, user_id: userId, joined_at: new Date().toISOString() })
    if (error) throw error
  },

  async updateStatus(callId: string, status: 'active' | 'ended' | 'missed' | 'declined') {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('call_sessions')
      .update({
        status,
        ...(status === 'active' && { connected_at: now }),
        ...((status === 'ended' || status === 'declined' || status === 'missed') && { ended_at: now }),
      })
      .eq('id', callId)
    if (error) throw error
  },

  async sendSignal(callId: string, senderId: string, signalType: SignalType, payload: unknown) {
    const { error } = await supabase
      .from('call_signals')
      .insert({ call_id: callId, sender_id: senderId, signal_type: signalType, payload })
    if (error) throw error
  },

  subscribeToSignals(callId: string, onSignal: (signal: CallSignalRow) => void) {
    const channel = supabase
      .channel(`call-signals:${callId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'call_signals', filter: `call_id=eq.${callId}` },
        (payload) => onSignal(payload.new as CallSignalRow),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  },

  /**
   * Global "someone is calling me" listener for the dashboard shell.
   * Realtime filters can't express "a conversation I'm a member of," so this
   * subscribes to every new call session and checks membership per event —
   * fine at this volume, and RLS still guarantees a user can only ever read
   * rows for conversations they're actually in (see the migration fixing
   * call_sessions visibility).
   */
  subscribeToIncomingCalls(userId: string, onIncoming: (call: { id: string; conversation_id: string; caller_id: string; type: 'voice' | 'video' }) => void) {
    const channel = supabase
      .channel(`incoming-calls:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'call_sessions' },
        async (payload) => {
          const call = payload.new as { id: string; conversation_id: string; caller_id: string; type: 'voice' | 'video' }
          if (call.caller_id === userId) return
          const { data } = await supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', call.conversation_id)
            .eq('user_id', userId)
            .maybeSingle()
          if (data) onIncoming(call)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  },

  subscribeToCallStatus(callId: string, onChange: (status: string) => void) {
    const channel = supabase
      .channel(`call-status:${callId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'call_sessions', filter: `id=eq.${callId}` },
        (payload) => onChange((payload.new as { status: string }).status),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  },
}

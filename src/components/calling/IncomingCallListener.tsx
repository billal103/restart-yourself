import { Phone, PhoneOff, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface IncomingCall {
  id: string
  conversationId: string
  callerId: string
  type: 'voice' | 'video'
  callerName: string
}

/**
 * Mounted once in DashboardLayout. Listens for real incoming calls (only
 * when a Supabase project is configured — a no-op otherwise) and requires
 * explicit accept/decline, per the non-negotiable "no unsolicited calls"
 * requirement. Every heavy import (the Supabase client, the calling
 * service) is loaded lazily inside the effect so this component — part of
 * the eagerly-bundled dashboard shell — doesn't reintroduce the bundle-size
 * regression fixed in Milestone 2.
 */
export function IncomingCallListener() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [incoming, setIncoming] = useState<IncomingCall | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return
    let unsubscribe: (() => void) | undefined

    void import('@/services/calling.service').then(({ callingService }) => {
      unsubscribe = callingService.subscribeToIncomingCalls(user.id, (call) => {
        void callingService.getCallerProfile(call.caller_id).then((profile) => {
          setIncoming({
            id: call.id,
            conversationId: call.conversation_id,
            callerId: call.caller_id,
            type: call.type,
            callerName: profile.display_name,
          })
        })
      })
    })

    return () => unsubscribe?.()
  }, [user])

  async function handleDecline() {
    if (!incoming) return
    const { callingService } = await import('@/services/calling.service')
    await callingService.updateStatus(incoming.id, 'declined')
    setIncoming(null)
  }

  async function handleAccept() {
    if (!incoming || !user) return
    const { callingService } = await import('@/services/calling.service')
    await callingService.joinCall(incoming.id, user.id)
    await callingService.updateStatus(incoming.id, 'active')
    navigate(`/dashboard/call/${incoming.id}?type=${incoming.type}&role=callee`)
    setIncoming(null)
  }

  return (
    <Dialog open={Boolean(incoming)} onOpenChange={(open) => !open && setIncoming(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Incoming {incoming?.type === 'video' ? 'video' : 'voice'} call
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-text-secondary">{incoming?.callerName} is calling you.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="destructive" onClick={() => void handleDecline()}>
            <PhoneOff className="size-4" /> Decline
          </Button>
          <Button onClick={() => void handleAccept()}>
            {incoming?.type === 'video' ? <Video className="size-4" /> : <Phone className="size-4" />} Accept
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

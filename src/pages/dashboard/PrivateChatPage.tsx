import { Flag, Phone, SendHorizontal, UserX, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AnonymousAvatar } from '@/components/common/AnonymousAvatar'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { MessageBubble } from '@/components/messaging/MessageBubble'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { conversations, getMessagesForConversation } from '@/lib/mockData'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import type { AnonymousAuthor } from '@/types/domain'

interface RealMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

const quickEmoji = ['❤️', '🙏', '💪', '😊', '🌱']

export default function PrivateChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const mockConversation = conversations.find((c) => c.id === conversationId)

  const [participant, setParticipant] = useState<AnonymousAuthor | null>(
    mockConversation ? mockConversation.participant : null,
  )
  const [otherUserId, setOtherUserId] = useState<string | null>(null)
  const [mockMessages, setMockMessages] = useState(() => getMessagesForConversation(conversationId ?? ''))
  const [realMessages, setRealMessages] = useState<RealMessage[]>([])
  const [draft, setDraft] = useState('')
  const [blockOpen, setBlockOpen] = useState(false)
  const [loaded, setLoaded] = useState(!isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured || !conversationId || !user) return
    let unsubscribe: (() => void) | undefined

    void (async () => {
      const [{ messagingService }] = await Promise.all([import('@/services/messaging.service')])
      const [other, messages] = await Promise.all([
        messagingService.getOtherParticipant(conversationId, user.id),
        messagingService.listMessages(conversationId),
      ])
      setOtherUserId(other.user_id)
      const profile = Array.isArray(other.anonymous_profiles) ? other.anonymous_profiles[0] : other.anonymous_profiles
      setParticipant({
        anonymousId: other.user_id,
        displayName: profile?.display_name ?? 'Anonymous',
        avatarColor: profile?.avatar_color ?? '#6d4bd6',
        isVerifiedProfessional: profile?.is_verified_professional ?? false,
      })
      setRealMessages(messages as RealMessage[])
      setLoaded(true)

      unsubscribe = messagingService.subscribeToMessages(conversationId, async () => {
        const fresh = await messagingService.listMessages(conversationId)
        setRealMessages(fresh as RealMessage[])
      })
    })()

    return () => unsubscribe?.()
  }, [conversationId, user])

  if (!conversationId || (!mockConversation && !isSupabaseConfigured)) {
    return <Navigate to="/dashboard/messages" replace />
  }
  if (!participant) return null

  async function sendMessage() {
    if (!draft.trim() || !conversationId) return
    if (isSupabaseConfigured) {
      try {
        const { messagingService } = await import('@/services/messaging.service')
        await messagingService.sendMessage(conversationId, draft)
        setDraft('')
      } catch (error) {
        toast({
          title: 'Could not send message',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
      }
      return
    }
    setMockMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        conversationId,
        senderId: 'me',
        content: draft,
        sentAt: new Date().toISOString(),
        readAt: null,
      },
    ])
    setDraft('')
  }

  async function startCall(type: 'voice' | 'video') {
    if (!conversationId) return
    if (!isSupabaseConfigured) {
      navigate(`/dashboard/call/call-${conversationId}?type=${type}`)
      return
    }
    try {
      const { callingService } = await import('@/services/calling.service')
      const callId = await callingService.startCall(conversationId, type)
      navigate(`/dashboard/call/${callId}?type=${type}&role=caller`)
    } catch (error) {
      toast({
        title: 'Could not start call',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'error',
      })
    }
  }

  async function handleBlock() {
    if (isSupabaseConfigured && user && otherUserId) {
      try {
        const { socialService } = await import('@/services/social.service')
        await socialService.blockUser(user.id, otherUserId)
      } catch (error) {
        toast({
          title: 'Could not block user',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
        return
      }
    }
    toast({ title: 'User blocked', variant: 'success' })
    navigate('/dashboard/messages')
  }

  async function handleReport() {
    if (isSupabaseConfigured && user && conversationId) {
      try {
        const { socialService } = await import('@/services/social.service')
        await socialService.reportCommunication(user.id, 'conversation', conversationId, 'Reported from chat')
      } catch {
        // Reporting failures shouldn't block the user from continuing to use chat.
      }
    }
    toast({ title: 'Conversation reported', description: 'Our moderation team will review this.' })
  }

  const displayMessages = isSupabaseConfigured
    ? realMessages.map((m) => ({
        id: m.id,
        content: m.content,
        sentAt: m.created_at,
        isOwn: m.sender_id === user?.id,
        isRead: Boolean(m.read_at),
      }))
    : mockMessages.map((m) => ({
        id: m.id,
        content: m.content,
        sentAt: m.sentAt,
        isOwn: m.senderId === 'me',
        isRead: Boolean(m.readAt),
      }))

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col lg:h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between border-b border-surface-muted pb-4">
        <AnonymousAvatar author={participant} />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void startCall('voice')}
            className="focus-ring rounded-full p-2 hover:bg-surface"
            aria-label="Start voice call"
          >
            <Phone className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => void startCall('video')}
            className="focus-ring rounded-full p-2 hover:bg-surface"
            aria-label="Start video call"
          >
            <Video className="size-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Report conversation"
            className="focus-ring rounded-full p-2 hover:bg-surface"
            onClick={() => void handleReport()}
          >
            <Flag className="size-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Block user"
            className="focus-ring rounded-full p-2 hover:bg-error-50 hover:text-error-500"
            onClick={() => setBlockOpen(true)}
          >
            <UserX className="size-[18px]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {!loaded ? (
          <p className="text-sm text-text-muted">Loading conversation…</p>
        ) : (
          <div className="flex flex-col gap-3">
            {displayMessages.map((message) => (
              <MessageBubble
                key={message.id}
                content={message.content}
                sentAt={message.sentAt}
                isOwn={message.isOwn}
                isRead={message.isRead}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-surface-muted pt-4">
        <div className="flex gap-1">
          {quickEmoji.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="focus-ring rounded-full p-1 text-lg hover:bg-surface"
              onClick={() => setDraft((prev) => prev + emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void sendMessage()}
          placeholder="Write a message…"
          className="flex-1"
        />
        <Button size="icon" aria-label="Send message" onClick={() => void sendMessage()}>
          <SendHorizontal className="size-4" />
        </Button>
      </div>

      <ConfirmDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        title={`Block ${participant.displayName}?`}
        description="They will no longer be able to message or call you. You can unblock them later from Privacy Settings."
        confirmLabel="Block"
        destructive
        onConfirm={() => void handleBlock()}
      />
    </div>
  )
}

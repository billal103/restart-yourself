import { Check, MessageCircle, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnonymousAvatar } from '@/components/common/AnonymousAvatar'
import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { conversations as initialConversations } from '@/lib/mockData'
import { cn, formatRelativeDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'

interface ConversationRow {
  id: string
  displayName: string
  avatarColor: string
  lastMessage: string
  lastMessageAt: string
  isRequest: boolean
  unreadCount: number
}

export default function MyConversationsPage() {
  const user = useAuthStore((state) => state.user)
  const [mockConversations, setMockConversations] = useState(initialConversations)
  const [realConversations, setRealConversations] = useState<ConversationRow[]>([])
  const [loaded, setLoaded] = useState(!isSupabaseConfigured)
  const [tab, setTab] = useState<'active' | 'requests'>('active')

  async function loadReal() {
    if (!user) return
    const { messagingService } = await import('@/services/messaging.service')
    const summaries = await messagingService.listConversationSummaries(user.id)
    setRealConversations(
      summaries
        .filter((s) => !s.isPendingMine)
        .map((s) => ({
          id: s.conversationId,
          displayName: s.displayName,
          avatarColor: s.avatarColor,
          lastMessage: s.lastMessage,
          lastMessageAt: s.lastMessageAt,
          isRequest: s.isRequest,
          unreadCount: 0,
        })),
    )
    setLoaded(true)
  }

  useEffect(() => {
    if (isSupabaseConfigured) void loadReal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const list = isSupabaseConfigured
    ? realConversations.filter((c) => (tab === 'active' ? !c.isRequest : c.isRequest))
    : mockConversations
        .filter((c) => (tab === 'active' ? !c.isRequest : c.isRequest))
        .map((c) => ({
          id: c.id,
          displayName: c.participant.displayName,
          avatarColor: c.participant.avatarColor,
          lastMessage: c.lastMessage,
          lastMessageAt: c.lastMessageAt,
          isRequest: c.isRequest,
          unreadCount: c.unreadCount,
        }))

  const activeCount = isSupabaseConfigured
    ? realConversations.filter((c) => !c.isRequest).length
    : mockConversations.filter((c) => !c.isRequest).length
  const requestCount = isSupabaseConfigured
    ? realConversations.filter((c) => c.isRequest).length
    : mockConversations.filter((c) => c.isRequest).length

  async function acceptRequest(id: string) {
    if (isSupabaseConfigured) {
      try {
        const { messagingService } = await import('@/services/messaging.service')
        await messagingService.respondToRequest(id, true)
        await loadReal()
      } catch (error) {
        toast({
          title: 'Could not accept request',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
      }
      return
    }
    setMockConversations((prev) => prev.map((c) => (c.id === id ? { ...c, isRequest: false } : c)))
  }

  async function declineRequest(id: string) {
    if (isSupabaseConfigured) {
      try {
        const { messagingService } = await import('@/services/messaging.service')
        await messagingService.respondToRequest(id, false)
        await loadReal()
      } catch (error) {
        toast({
          title: 'Could not decline request',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
      }
      return
    }
    setMockConversations((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Conversations</h1>
        <p className="mt-1 text-text-secondary">
          A conversation begins only after a message request is accepted.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'active' | 'requests')}>
        <TabsList>
          <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({requestCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {!loaded ? (
        <p className="text-sm text-text-muted">Loading conversations…</p>
      ) : list.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title={tab === 'active' ? 'No active conversations' : 'No pending requests'}
          description="New conversations will appear here."
        />
      ) : (
        <div className="flex flex-col divide-y divide-surface-muted rounded-card border border-surface-muted">
          {list.map((conv) => (
            <div key={conv.id} className="flex items-center justify-between gap-4 p-4">
              <Link
                to={tab === 'active' ? `/dashboard/messages/${conv.id}` : '#'}
                className={cn('flex flex-1 items-center gap-3', tab === 'requests' && 'pointer-events-none')}
              >
                <AnonymousAvatar
                  author={{
                    anonymousId: conv.id,
                    displayName: conv.displayName,
                    avatarColor: conv.avatarColor,
                    isVerifiedProfessional: false,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text-secondary">{conv.lastMessage}</p>
                </div>
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-text-muted">{formatRelativeDate(conv.lastMessageAt)}</span>
                {tab === 'active' && conv.unreadCount > 0 && (
                  <Badge variant="default">{conv.unreadCount}</Badge>
                )}
                {tab === 'requests' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => void declineRequest(conv.id)}>
                      <UserX className="size-3.5" />
                    </Button>
                    <Button size="sm" onClick={() => void acceptRequest(conv.id)}>
                      <Check className="size-3.5" /> Accept
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

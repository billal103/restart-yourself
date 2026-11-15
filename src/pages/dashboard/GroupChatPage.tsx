import { Flag, Info, SendHorizontal, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { AnonymousAvatar } from '@/components/common/AnonymousAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { getMessagesForGroup, groups as mockGroups, makeAuthor } from '@/lib/mockData'
import { formatRelativeDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import type { AnonymousAuthor } from '@/types/domain'

interface GroupMessageRow {
  id: string
  author: AnonymousAuthor
  content: string
  sentAt: string
}

const mockMembers = [501, 502, 503, 504, 505].map((seed) => makeAuthor(seed))

export default function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const user = useAuthStore((state) => state.user)
  const mockGroup = mockGroups.find((g) => g.id === groupId)

  const [groupInfo, setGroupInfo] = useState<{ name: string; memberCount: number; guidelines: string } | null>(
    mockGroup
      ? { name: mockGroup.name, memberCount: mockGroup.memberCount, guidelines: mockGroup.guidelines }
      : null,
  )
  const [messages, setMessages] = useState<GroupMessageRow[]>(
    mockGroup
      ? getMessagesForGroup(mockGroup.id).map((m) => ({ id: m.id, author: m.author, content: m.content, sentAt: m.sentAt }))
      : [],
  )
  const [members, setMembers] = useState<AnonymousAuthor[]>(mockGroup ? mockMembers : [])
  const [roomId, setRoomId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const [loaded, setLoaded] = useState(!isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured || !groupId) return
    let unsubscribe: (() => void) | undefined

    void (async () => {
      const { groupsService } = await import('@/services/groups.service')
      const [community, memberCount, room, memberRows] = await Promise.all([
        groupsService.getCommunity(groupId),
        groupsService.getMemberCount(groupId),
        groupsService.getChatRoomId(groupId),
        groupsService.listMembers(groupId),
      ])
      setGroupInfo({ name: community.name, memberCount, guidelines: community.guidelines ?? '' })
      setRoomId(room)
      setMembers(
        memberRows.map((m) => {
          const profile = Array.isArray(m.anonymous_profiles) ? m.anonymous_profiles[0] : m.anonymous_profiles
          return {
            anonymousId: m.user_id,
            displayName: profile?.display_name ?? 'Anonymous',
            avatarColor: profile?.avatar_color ?? '#6d4bd6',
            isVerifiedProfessional: false,
          }
        }),
      )

      async function refresh() {
        const rows = await groupsService.listMessages(room)
        setMessages(
          rows.map((m) => {
            const profile = Array.isArray(m.anonymous_profiles) ? m.anonymous_profiles[0] : m.anonymous_profiles
            return {
              id: m.id,
              content: m.content,
              sentAt: m.created_at,
              author: {
                anonymousId: m.author_id,
                displayName: profile?.display_name ?? 'Anonymous',
                avatarColor: profile?.avatar_color ?? '#6d4bd6',
                isVerifiedProfessional: false,
              },
            }
          }),
        )
      }

      await refresh()
      setLoaded(true)
      unsubscribe = groupsService.subscribeToMessages(room, () => void refresh())
    })()

    return () => unsubscribe?.()
  }, [groupId])

  if (!groupId || (!mockGroup && !isSupabaseConfigured)) return <Navigate to="/groups" replace />
  if (!loaded || !groupInfo) return null

  async function send() {
    if (!draft.trim()) return
    if (isSupabaseConfigured && roomId && user) {
      try {
        const { groupsService } = await import('@/services/groups.service')
        await groupsService.sendMessage(roomId, user.id, draft)
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
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), author: makeAuthor(999), content: draft, sentAt: new Date().toISOString() },
    ])
    setDraft('')
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-6 lg:h-[calc(100vh-4rem)]">
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-surface-muted pb-4">
          <div>
            <h1 className="font-semibold text-text-primary">{groupInfo.name}</h1>
            <p className="text-xs text-text-muted">{groupInfo.memberCount} members</p>
          </div>
          <button
            type="button"
            className="focus-ring rounded-full p-2 hover:bg-surface lg:hidden"
            aria-label="Show members"
            onClick={() => setShowMembers((v) => !v)}
          >
            <Users className="size-[18px]" />
          </button>
        </div>

        {showMembers && (
          <div className="flex flex-col gap-2 border-b border-surface-muted py-3 lg:hidden">
            <p className="text-xs font-semibold text-text-muted">Members</p>
            {members.map((member) => (
              <AnonymousAvatar key={member.anonymousId} author={member} size="sm" />
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4">
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <AnonymousAvatar author={message.author} size="sm" showName={false} />
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {message.author.displayName}
                    </span>
                    <span className="text-xs text-text-muted">{formatRelativeDate(message.sentAt)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-text-secondary">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-surface-muted pt-4">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void send()}
            placeholder="Message the group…"
            className="flex-1"
          />
          <Button size="icon" aria-label="Send" onClick={() => void send()}>
            <SendHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      <aside className="hidden w-64 shrink-0 flex-col gap-4 border-l border-surface-muted pl-6 lg:flex">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Info className="size-4" /> Group Guidelines
          </h2>
          <p className="mt-2 text-xs text-text-secondary">{groupInfo.guidelines}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Members</h2>
          <div className="mt-2 flex flex-col gap-2">
            {members.map((member) => (
              <AnonymousAvatar key={member.anonymousId} author={member} size="sm" />
            ))}
          </div>
        </div>
        <button
          type="button"
          className="focus-ring flex items-center gap-1.5 text-xs font-medium text-error-500 hover:underline"
          onClick={() => toast({ title: 'Group reported', description: 'Our moderation team will review this group.' })}
        >
          <Flag className="size-3.5" /> Report this group
        </button>
      </aside>
    </div>
  )
}

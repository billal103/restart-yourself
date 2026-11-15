import { ScrollText, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { groups as mockGroups } from '@/lib/mockData'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'

interface GroupDetails {
  id: string
  name: string
  description: string
  guidelines: string
  memberCount: number
}

export default function GroupDetailsPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const mockGroup = mockGroups.find((g) => g.id === groupId)

  const [group, setGroup] = useState<GroupDetails | null>(
    mockGroup
      ? {
          id: mockGroup.id,
          name: mockGroup.name,
          description: mockGroup.description,
          guidelines: mockGroup.guidelines,
          memberCount: mockGroup.memberCount,
        }
      : null,
  )
  const [joined, setJoined] = useState(mockGroup?.isMember ?? false)
  const [loaded, setLoaded] = useState(!isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured || !groupId) return
    void (async () => {
      const { groupsService } = await import('@/services/groups.service')
      const [community, memberCount, isMemberResult] = await Promise.all([
        groupsService.getCommunity(groupId),
        groupsService.getMemberCount(groupId),
        user ? groupsService.isMember(groupId, user.id) : Promise.resolve(false),
      ])
      setGroup({
        id: community.id,
        name: community.name,
        description: community.description ?? '',
        guidelines: community.guidelines ?? '',
        memberCount,
      })
      setJoined(isMemberResult)
      setLoaded(true)
    })()
  }, [groupId, user])

  if (!groupId || (!mockGroup && !isSupabaseConfigured)) return <Navigate to="/groups" replace />
  if (!loaded || !group) return null

  async function handleJoin() {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (isSupabaseConfigured && user && groupId) {
      try {
        const { groupsService } = await import('@/services/groups.service')
        await groupsService.join(groupId, user.id)
      } catch (error) {
        toast({
          title: 'Could not join group',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
        return
      }
    }
    setJoined(true)
  }

  async function handleLeave() {
    if (isSupabaseConfigured && user && groupId) {
      try {
        const { groupsService } = await import('@/services/groups.service')
        await groupsService.leave(groupId, user.id)
      } catch (error) {
        toast({
          title: 'Could not leave group',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
        return
      }
    }
    setJoined(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">{group.name}</h1>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-text-muted">
        <Users className="size-4" /> {group.memberCount} members
      </p>
      <p className="mt-4 text-text-secondary">{group.description}</p>

      <div className="mt-6 flex gap-3">
        {joined ? (
          <>
            <Button asChild>
              <Link to={`/dashboard/groups/${group.id}/chat`}>Open Group Chat</Link>
            </Button>
            <Button variant="outline" onClick={() => void handleLeave()}>
              Leave Group
            </Button>
          </>
        ) : (
          <Button onClick={() => void handleJoin()}>Join Group</Button>
        )}
      </div>

      <Card className="mt-10">
        <CardContent className="flex items-start gap-3 pt-6">
          <ScrollText className="mt-0.5 size-5 shrink-0 text-primary-500" />
          <div>
            <h2 className="font-semibold text-text-primary">Group Guidelines</h2>
            <p className="mt-1 text-sm text-text-secondary">{group.guidelines}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

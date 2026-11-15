import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { groups as mockGroups } from '@/lib/mockData'
import { useAuthStore } from '@/stores/authStore'

interface GroupRow {
  id: string
  name: string
  description: string
  memberCount: number
  isMember: boolean
}

export default function CommunityGroupsPage() {
  const user = useAuthStore((state) => state.user)
  const [groups, setGroups] = useState<GroupRow[]>(
    isSupabaseConfigured
      ? []
      : mockGroups.map((g) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          memberCount: g.memberCount,
          isMember: g.isMember,
        })),
  )
  const [loaded, setLoaded] = useState(!isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void (async () => {
      const { groupsService } = await import('@/services/groups.service')
      const rows = await groupsService.listWithMembership(user?.id ?? null)
      setGroups(
        rows.map((g) => ({
          id: g.id,
          name: g.name,
          description: g.description ?? '',
          memberCount: g.memberCount,
          isMember: g.isMember,
        })),
      )
      setLoaded(true)
    })()
  }, [user])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Community Groups</h1>
      <p className="mt-2 text-text-secondary">
        Join topic-based groups to connect with people navigating similar experiences.
      </p>

      {!loaded ? (
        <p className="mt-8 text-sm text-text-muted">Loading groups…</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardContent className="flex flex-col gap-3 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">{group.name}</h3>
                  {group.isMember && <span className="text-xs font-medium text-success-700">Joined</span>}
                </div>
                <p className="text-sm text-text-secondary">{group.description}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                    <Users className="size-3.5" /> {group.memberCount} members
                  </span>
                  <Button asChild variant={group.isMember ? 'outline' : 'default'} size="sm">
                    <Link to={`/groups/${group.id}`}>{group.isMember ? 'View Group' : 'Learn More'}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

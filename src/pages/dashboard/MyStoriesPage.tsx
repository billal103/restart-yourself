import { BookHeart, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { stories as mockStories } from '@/lib/mockData'
import { formatRelativeDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import type { Story, StoryStatus } from '@/types/domain'

const statusVariant: Record<StoryStatus, 'default' | 'secondary' | 'success' | 'warning' | 'error'> = {
  draft: 'secondary',
  pending: 'warning',
  published: 'success',
  rejected: 'error',
  archived: 'secondary',
}

export default function MyStoriesPage() {
  const user = useAuthStore((state) => state.user)
  const [filter, setFilter] = useState<'all' | StoryStatus>('all')
  const [stories, setStories] = useState<Story[]>(isSupabaseConfigured ? [] : mockStories)
  const [loaded, setLoaded] = useState(!isSupabaseConfigured)
  const [deleteTarget, setDeleteTarget] = useState<Story | null>(null)

  async function loadMine() {
    if (!isSupabaseConfigured || !user) return
    const { storiesService } = await import('@/services/stories.service')
    setStories(await storiesService.listMine(user.id))
    setLoaded(true)
  }

  useEffect(() => {
    void loadMine()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const myStories = filter === 'all' ? stories : stories.filter((s) => s.status === filter)

  async function handleDelete() {
    if (!deleteTarget) return
    if (isSupabaseConfigured) {
      try {
        const { storiesService } = await import('@/services/stories.service')
        await storiesService.delete(deleteTarget.id)
        await loadMine()
      } catch (error) {
        toast({
          title: 'Could not delete story',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
        return
      }
    } else {
      setStories((prev) => prev.filter((s) => s.id !== deleteTarget.id))
    }
    toast({ title: 'Story deleted', variant: 'success' })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">My Stories</h1>
        <Button asChild size="sm">
          <Link to="/dashboard/stories/new">
            <Plus className="size-4" /> New Story
          </Link>
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | StoryStatus)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {!loaded ? (
        <p className="text-sm text-text-muted">Loading your stories…</p>
      ) : myStories.length === 0 ? (
        <EmptyState
          icon={BookHeart}
          title="No stories here"
          description="Stories matching this filter will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {myStories.map((story) => (
            <Card key={story.id}>
              <CardContent className="flex items-center justify-between gap-4 pt-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/dashboard/stories/${story.id}/edit`}
                      className="font-medium text-text-primary hover:text-primary-700"
                    >
                      {story.title}
                    </Link>
                    <Badge variant={statusVariant[story.status]}>{story.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {formatRelativeDate(story.createdAt)} · {story.category.name}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/dashboard/stories/${story.id}/edit`}>Edit</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Delete story"
                    onClick={() => setDeleteTarget(story)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this story?"
        description="This cannot be undone. The story, its comments, and reactions will be permanently deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}

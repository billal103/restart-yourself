import { ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { stories as mockStories } from '@/lib/mockData'
import { toast } from '@/stores/toastStore'
import { formatRelativeDate } from '@/lib/utils'
import type { Story } from '@/types/domain'

export default function StoryModerationPage() {
  const [pending, setPending] = useState<Story[]>(isSupabaseConfigured ? [] : mockStories.filter((s) => s.status === 'pending'))
  const [published, setPublished] = useState<Story[]>(isSupabaseConfigured ? [] : mockStories.filter((s) => s.status === 'published'))
  const [tab, setTab] = useState<'pending' | 'published'>('pending')
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)

  async function load() {
    if (!isSupabaseConfigured) return
    const { storiesService } = await import('@/services/stories.service')
    const [pendingRows, publishedRows] = await Promise.all([
      storiesService.listByStatus('pending'),
      storiesService.listByStatus('published'),
    ])
    setPending(pendingRows)
    setPublished(publishedRows)
  }

  useEffect(() => {
    void (async () => {
      await load()
    })()
  }, [])

  const queue = tab === 'pending' ? pending : published

  async function approve(id: string) {
    if (isSupabaseConfigured) {
      try {
        const { moderationService } = await import('@/services/moderation.service')
        await moderationService.approveStory(id)
        await load()
      } catch (error) {
        toast({ title: 'Could not approve story', description: error instanceof Error ? error.message : 'Please try again.', variant: 'error' })
        return
      }
    } else {
      setPending((prev) => prev.filter((s) => s.id !== id))
      const story = mockStories.find((s) => s.id === id)
      if (story) setPublished((prev) => [...prev, { ...story, status: 'published' as const }])
    }
    toast({ title: 'Story approved and published', variant: 'success' })
  }

  async function reject(id: string) {
    if (isSupabaseConfigured) {
      try {
        const { moderationService } = await import('@/services/moderation.service')
        await moderationService.rejectStory(id)
        await load()
      } catch (error) {
        toast({ title: 'Could not reject story', description: error instanceof Error ? error.message : 'Please try again.', variant: 'error' })
        return
      }
    } else {
      setPending((prev) => prev.filter((s) => s.id !== id))
    }
    toast({ title: 'Story rejected' })
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-primary">Story Moderation</h1>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'pending' | 'published')}>
        <TabsList>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
        </TabsList>
      </Tabs>

      {queue.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Queue is empty" description="Nothing to review right now." />
      ) : (
        <div className="flex flex-col gap-4">
          {queue.map((story) => (
            <Card key={story.id}>
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-text-primary">{story.title}</h3>
                    {story.contentWarnings.length > 0 && <Badge variant="warning">CW</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{story.excerpt}</p>
                  <p className="mt-2 text-xs text-text-muted">
                    {story.category.name} · submitted {formatRelativeDate(story.createdAt)}
                  </p>
                </div>
                {tab === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => setRejectTarget(story.id)}>
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => void approve(story.id)}>
                      Approve
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        title="Reject this story?"
        description="The author will be notified that their story did not pass moderation review."
        confirmLabel="Reject Story"
        destructive
        onConfirm={() => rejectTarget && void reject(rejectTarget)}
      />
    </div>
  )
}

import { MessageSquareWarning } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AnonymousAvatar } from '@/components/common/AnonymousAvatar'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { comments as mockComments } from '@/lib/mockData'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { formatRelativeDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import type { ReportedComment } from '@/types/domain'

const mockReported: ReportedComment[] = mockComments.map((comment) => ({
  reportId: `report-${comment.id}`,
  comment,
  reason: 'Reported by a community member.',
  reporterName: 'A community member',
}))

export default function CommentModerationPage() {
  const user = useAuthStore((state) => state.user)
  const [reported, setReported] = useState<ReportedComment[]>(isSupabaseConfigured ? [] : mockReported)

  async function load() {
    if (!isSupabaseConfigured) return
    const { moderationService } = await import('@/services/moderation.service')
    setReported(await moderationService.listReportedComments())
  }

  useEffect(() => {
    void (async () => {
      await load()
    })()
  }, [])

  async function remove(reportId: string, commentId: string) {
    if (isSupabaseConfigured && user) {
      try {
        const { moderationService } = await import('@/services/moderation.service')
        await moderationService.removeReportedComment(reportId, commentId, user.id)
        await load()
      } catch (error) {
        toast({ title: 'Could not remove comment', description: error instanceof Error ? error.message : 'Please try again.', variant: 'error' })
        return
      }
    } else {
      setReported((prev) => prev.filter((r) => r.reportId !== reportId))
    }
    toast({ title: 'Comment removed', variant: 'success' })
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-primary">Comment Moderation</h1>
      <p className="text-text-secondary">Reported and flagged comments awaiting review.</p>

      {reported.length === 0 ? (
        <EmptyState icon={MessageSquareWarning} title="No comments to review" description="Reported comments will appear here." />
      ) : (
        <div className="flex flex-col gap-3">
          {reported.map((item) => (
            <Card key={item.reportId}>
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div>
                  <AnonymousAvatar author={item.comment.author} size="sm" />
                  <p className="mt-2 text-sm text-text-primary">{item.comment.content}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    On story {item.comment.storyId} · {formatRelativeDate(item.comment.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Reported by {item.reporterName}: “{item.reason}”
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => void remove(item.reportId, item.comment.id)}>
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

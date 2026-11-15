import { AlertTriangle, Bookmark, Flag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AnonymousAvatar } from '@/components/common/AnonymousAvatar'
import { CommentThread } from '@/components/community/CommentThread'
import { CategoryBadge } from '@/components/stories/CategoryBadge'
import { ReactionBar } from '@/components/stories/ReactionBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { getCommentsForStory, getStoryById, stories as mockStories } from '@/lib/mockData'
import { formatRelativeDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import type { Comment, Story } from '@/types/domain'

export default function StoryDetailsPage() {
  const { storyId } = useParams<{ storyId: string }>()
  const user = useAuthStore((state) => state.user)
  const [showWarning, setShowWarning] = useState(true)
  const [bookmarked, setBookmarked] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')

  const mockStory = storyId ? getStoryById(storyId) : undefined
  const [story, setStory] = useState<Story | null | undefined>(isSupabaseConfigured ? undefined : mockStory)
  const [comments, setComments] = useState<Comment[]>(mockStory ? getCommentsForStory(mockStory.id) : [])
  const [related, setRelated] = useState<Story[]>([])
  const [loaded, setLoaded] = useState(!isSupabaseConfigured)

  async function loadComments() {
    if (!isSupabaseConfigured || !storyId) return
    const { commentsService } = await import('@/services/comments.service')
    const rows = await commentsService.listForStory(storyId)
    const byId = new Map<string, Comment>()
    const roots: Comment[] = []
    for (const row of rows) {
      const profile = Array.isArray(row.anonymous_profiles) ? row.anonymous_profiles[0] : row.anonymous_profiles
      byId.set(row.id, {
        id: row.id,
        storyId: row.story_id,
        author: {
          anonymousId: row.author_id,
          displayName: profile?.display_name ?? 'Anonymous',
          avatarColor: profile?.avatar_color ?? '#6d4bd6',
          isVerifiedProfessional: false,
        },
        content: row.content,
        createdAt: row.created_at,
        parentId: row.parent_id,
        replies: [],
      })
    }
    for (const row of rows) {
      const comment = byId.get(row.id)!
      if (row.parent_id) byId.get(row.parent_id)?.replies.push(comment)
      else roots.push(comment)
    }
    setComments(roots)
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !storyId) return
    void (async () => {
      const { storiesService } = await import('@/services/stories.service')
      const fetched = await storiesService.getById(storyId)
      setStory(fetched)
      if (fetched && user) {
        const { socialService } = await import('@/services/social.service')
        const mine = await socialService.listMyBookmarks(user.id)
        setBookmarked(mine.some((b) => b.story_id === storyId))
      }
      if (fetched) {
        const all = await storiesService.listPublished(50)
        setRelated(all.filter((s) => s.id !== fetched.id && s.category.id === fetched.category.id).slice(0, 3))
      }
      await loadComments()
      setLoaded(true)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, user])

  if (!storyId) return <Navigate to="/explore" replace />
  if (!isSupabaseConfigured && !story) return <Navigate to="/explore" replace />
  if (!loaded) return null
  if (isSupabaseConfigured && story === null) return <Navigate to="/explore" replace />
  if (!story) return null

  const relatedStories = isSupabaseConfigured
    ? related
    : mockStories.filter((s) => s.id !== story.id && s.category.id === story.category.id && s.status === 'published').slice(0, 3)

  const hasWarning = story.contentWarnings.length > 0 && showWarning

  async function toggleBookmark() {
    if (isSupabaseConfigured && user && storyId) {
      try {
        const { socialService } = await import('@/services/social.service')
        await socialService.toggleBookmark(user.id, storyId, bookmarked)
      } catch (error) {
        toast({
          title: 'Could not update bookmark',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
        return
      }
    }
    setBookmarked((v) => !v)
  }

  async function postComment() {
    if (!commentDraft.trim() || !storyId) return
    if (isSupabaseConfigured && user) {
      try {
        const { commentsService } = await import('@/services/comments.service')
        await commentsService.create(storyId, user.id, commentDraft)
        setCommentDraft('')
        await loadComments()
      } catch (error) {
        toast({
          title: 'Could not post comment',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
      }
      return
    }
    setComments((prev) => [
      {
        id: `local-comment-${Date.now()}`,
        storyId,
        author: {
          anonymousId: user?.id ?? 'you',
          displayName: user?.anonymousDisplayName ?? 'You',
          avatarColor: '#6d4bd6',
          isVerifiedProfessional: false,
        },
        content: commentDraft,
        createdAt: new Date().toISOString(),
        parentId: null,
        replies: [],
      },
      ...prev,
    ])
    setCommentDraft('')
  }

  async function handleReport() {
    if (isSupabaseConfigured && user && storyId) {
      try {
        const { socialService } = await import('@/services/social.service')
        await socialService.reportContent(user.id, 'story', storyId, 'Reported from story page')
        toast({ title: 'Story reported', description: 'Our moderation team will review this.' })
      } catch (error) {
        toast({
          title: 'Could not submit report',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
      }
      return
    }
    toast({ title: 'Story reported', description: 'Our moderation team will review this.' })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <AnonymousAvatar author={story.author} />
        <span className="text-sm text-text-muted">
          {story.publishedAt && formatRelativeDate(story.publishedAt)}
        </span>
      </div>

      <h1 className="mt-5 text-2xl font-bold text-text-primary sm:text-3xl">{story.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CategoryBadge category={story.category} />
        {story.tags.map((tag) => (
          <Badge key={tag.id} variant="secondary">
            #{tag.name}
          </Badge>
        ))}
      </div>

      {hasWarning ? (
        <Card className="mt-6 border-warning-500/30 bg-warning-50">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-700" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                Content warning: {story.contentWarnings.join(', ')}
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowWarning(false)}>
                Show story anyway
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="prose mt-6 max-w-none whitespace-pre-line text-text-primary">
          {story.content}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-y border-surface-muted py-4">
        <ReactionBar
          reactionCounts={story.reactionCounts}
          storyId={isSupabaseConfigured ? story.id : undefined}
          userId={isSupabaseConfigured ? user?.id : undefined}
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Bookmark"
            onClick={() => void toggleBookmark()}
            className="focus-ring rounded-full p-2 hover:bg-surface"
          >
            <Bookmark
              className="size-5"
              fill={bookmarked ? 'currentColor' : 'none'}
              style={bookmarked ? { color: 'var(--color-primary-500)' } : undefined}
            />
          </button>
          <button
            type="button"
            aria-label="Report"
            onClick={() => void handleReport()}
            className="focus-ring rounded-full p-2 hover:bg-surface"
          >
            <Flag className="size-5" />
          </button>
        </div>
      </div>

      <div id="comments" className="mt-10">
        <h2 className="text-lg font-semibold text-text-primary">
          Comments ({comments.length})
        </h2>

        <div className="mt-4 flex flex-col gap-2">
          <Textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder="Share a supportive comment…"
          />
          <Button size="sm" disabled={!commentDraft.trim()} className="self-end" onClick={() => void postComment()}>
            Post Comment
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          {comments.map((comment) => (
            <CommentThread key={comment.id} comment={comment} />
          ))}
        </div>
      </div>

      {relatedStories.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-text-primary">Related Stories</h2>
          <div className="mt-4 flex flex-col gap-3">
            {relatedStories.map((r) => (
              <Link
                key={r.id}
                to={`/stories/${r.id}`}
                className="rounded-lg border border-surface-muted p-4 hover:bg-surface"
              >
                <p className="text-sm font-medium text-text-primary">{r.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

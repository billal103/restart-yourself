import { Bookmark, Flag, Heart, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnonymousAvatar } from '@/components/common/AnonymousAvatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatRelativeDate, truncate } from '@/lib/utils'
import type { Story } from '@/types/domain'
import { CategoryBadge } from './CategoryBadge'

export function StoryCard({ story }: { story: Story }) {
  const [bookmarked, setBookmarked] = useState(story.bookmarked)
  const totalReactions = Object.values(story.reactionCounts).reduce((sum, n) => sum + n, 0)

  return (
    <Card className="flex flex-col gap-3 p-5 transition-shadow hover:shadow-elevated">
      <div className="flex items-center justify-between">
        <AnonymousAvatar author={story.author} size="sm" />
        <span className="text-xs text-text-muted">
          {story.publishedAt ? formatRelativeDate(story.publishedAt) : 'Draft'}
        </span>
      </div>

      <div>
        <Link to={`/stories/${story.id}`} className="block">
          <h3 className="text-base font-semibold text-text-primary hover:text-primary-700">
            {story.title}
          </h3>
        </Link>
        <p className="mt-1.5 text-sm text-text-secondary">{truncate(story.excerpt, 160)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={story.category} />
        {story.tags.slice(0, 2).map((tag) => (
          <Badge key={tag.id} variant="secondary">
            #{tag.name}
          </Badge>
        ))}
        {story.contentWarnings.length > 0 && (
          <Badge variant="warning">Content warning</Badge>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-surface-muted pt-3 text-text-secondary">
        <div className="flex items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="size-4" /> {totalReactions}
          </span>
          <Link
            to={`/stories/${story.id}#comments`}
            className="inline-flex items-center gap-1.5 hover:text-text-primary"
          >
            <MessageCircle className="size-4" /> {story.commentCount}
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Bookmark story"
            onClick={() => setBookmarked((v) => !v)}
            className="focus-ring rounded-full p-2 hover:bg-surface"
          >
            <Bookmark
              className="size-4"
              fill={bookmarked ? 'currentColor' : 'none'}
              style={bookmarked ? { color: 'var(--color-primary-500)' } : undefined}
            />
          </button>
          <button
            type="button"
            aria-label="Report story"
            className="focus-ring rounded-full p-2 hover:bg-surface"
          >
            <Flag className="size-4" />
          </button>
        </div>
      </div>
    </Card>
  )
}

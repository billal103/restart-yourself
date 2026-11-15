import { BookOpen } from 'lucide-react'
import type { Story } from '@/types/domain'
import { EmptyState } from '@/components/common/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { StoryCard } from './StoryCard'

interface StoryFeedProps {
  stories: Story[]
  loading?: boolean
}

export function StoryFeed({ stories, loading }: StoryFeedProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No stories yet"
        description="There are no stories here yet. Be the first to share your experience with the community."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} />
      ))}
    </div>
  )
}

import { useState } from 'react'
import { StoryFeed } from '@/components/stories/StoryFeed'
import { Badge } from '@/components/ui/badge'
import { categories, getPublishedStories } from '@/lib/mockData'
import { cn } from '@/lib/utils'

const allStories = getPublishedStories()

export default function CommunityFeedPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const stories = activeCategory
    ? allStories.filter((story) => story.category.slug === activeCategory)
    : allStories

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Community Feed</h1>
      <p className="mt-2 text-text-secondary">
        Recent stories shared by the community, newest first.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={() => setActiveCategory(null)}>
          <Badge
            variant={activeCategory === null ? 'default' : 'secondary'}
            className={cn('cursor-pointer')}
          >
            All
          </Badge>
        </button>
        {categories.map((category) => (
          <button key={category.id} type="button" onClick={() => setActiveCategory(category.slug)}>
            <Badge
              variant={activeCategory === category.slug ? 'default' : 'secondary'}
              className="cursor-pointer"
            >
              {category.name}
            </Badge>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <StoryFeed stories={stories} />
      </div>
    </div>
  )
}

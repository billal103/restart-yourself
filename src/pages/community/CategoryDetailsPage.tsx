import { Heart } from 'lucide-react'
import { Navigate, useParams } from 'react-router-dom'
import { StoryFeed } from '@/components/stories/StoryFeed'
import { categoryIcons } from '@/lib/categoryIcons'
import { categories, getPublishedStories } from '@/lib/mockData'

export default function CategoryDetailsPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>()
  const category = categories.find((c) => c.slug === categorySlug)
  if (!category) return <Navigate to="/explore" replace />

  const Icon = categoryIcons[category.icon] ?? Heart
  const stories = getPublishedStories().filter((story) => story.category.id === category.id)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary-50">
          <Icon className="size-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">{category.name}</h1>
          <p className="mt-1 text-text-secondary">{category.description}</p>
        </div>
      </div>

      <div className="mt-8">
        <StoryFeed stories={stories} />
      </div>
    </div>
  )
}

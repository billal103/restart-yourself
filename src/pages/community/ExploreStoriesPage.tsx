import { Search } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { StoryFeed } from '@/components/stories/StoryFeed'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { getPublishedStories } from '@/lib/mockData'
import type { Story } from '@/types/domain'

function totalReactions(story: Story) {
  return Object.values(story.reactionCounts).reduce((sum, n) => sum + n, 0)
}

export default function ExploreStoriesPage() {
  const [sort, setSort] = useState<'recent' | 'supported'>('recent')
  const [query, setQuery] = useState('')
  const [allStories, setAllStories] = useState<Story[]>(isSupabaseConfigured ? [] : getPublishedStories())
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void (async () => {
      const { storiesService } = await import('@/services/stories.service')
      setAllStories(await storiesService.listPublished(100))
      setLoading(false)
    })()
  }, [])

  const stories = useMemo(() => {
    const sorted = [...allStories].sort((a, b) =>
      sort === 'recent'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : totalReactions(b) - totalReactions(a),
    )
    return sorted
  }, [sort, allStories])

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Explore Stories</h1>
      <p className="mt-2 text-text-secondary">
        Discover stories from people navigating similar experiences.
      </p>

      <form onSubmit={handleSearchSubmit} className="relative mt-6 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stories…"
          className="pl-9"
        />
      </form>

      <div className="mt-6">
        <Tabs value={sort} onValueChange={(v) => setSort(v as 'recent' | 'supported')}>
          <TabsList>
            <TabsTrigger value="recent">Most Recent</TabsTrigger>
            <TabsTrigger value="supported">Most Supported</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-6">
        <StoryFeed stories={stories} loading={loading} />
      </div>
    </div>
  )
}

import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StoryFeed } from '@/components/stories/StoryFeed'
import { Input } from '@/components/ui/input'
import { categories, getPublishedStories } from '@/lib/mockData'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return getPublishedStories().filter((story) => {
      const matchesQuery =
        q.length === 0 ||
        story.title.toLowerCase().includes(q) ||
        story.content.toLowerCase().includes(q) ||
        story.tags.some((tag) => tag.name.toLowerCase().includes(q))
      const matchesCategory = categoryFilter === 'all' || story.category.slug === categoryFilter
      return matchesQuery && matchesCategory
    })
  }, [query, categoryFilter])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Search Stories</h1>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSearchParams(e.target.value ? { q: e.target.value } : {})
            }}
            placeholder="Search by title, content, or tag…"
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mt-4 text-sm text-text-muted">{results.length} result(s)</p>

      <div className="mt-4">
        <StoryFeed stories={results} />
      </div>
    </div>
  )
}

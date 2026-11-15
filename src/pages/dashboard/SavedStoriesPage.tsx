import { Bookmark } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '@/components/common/EmptyState'
import { StoryFeed } from '@/components/stories/StoryFeed'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { getPublishedStories } from '@/lib/mockData'
import { useAuthStore } from '@/stores/authStore'
import type { Story } from '@/types/domain'

export default function SavedStoriesPage() {
  const user = useAuthStore((state) => state.user)
  const [saved, setSaved] = useState<Story[]>(
    isSupabaseConfigured ? [] : getPublishedStories().filter((story) => story.bookmarked),
  )
  const [loaded, setLoaded] = useState(!isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return
    void (async () => {
      const [{ socialService }, { storiesService }] = await Promise.all([
        import('@/services/social.service'),
        import('@/services/stories.service'),
      ])
      const bookmarks = await socialService.listMyBookmarks(user.id)
      const stories = await storiesService.getByIds(bookmarks.map((b) => b.story_id))
      setSaved(stories.map((s) => ({ ...s, bookmarked: true })))
      setLoaded(true)
    })()
  }, [user])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Saved Stories</h1>
        <p className="mt-1 text-text-secondary">Stories you've bookmarked to revisit later.</p>
      </div>

      {!loaded ? (
        <p className="text-sm text-text-muted">Loading saved stories…</p>
      ) : saved.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved stories yet"
          description="Bookmark a story from the community feed to find it here later."
        />
      ) : (
        <StoryFeed stories={saved} />
      )}
    </div>
  )
}

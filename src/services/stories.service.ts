import { supabase } from '@/lib/supabase/client'
import type { StoryStatusDb } from '@/lib/supabase/database.types'
import type { AnonymousAuthor, Category, ReactionType, Story, Tag } from '@/types/domain'

export interface CreateStoryInput {
  title: string
  content: string
  excerpt?: string
  categoryId: string
  tagIds: string[]
  contentWarnings: string[]
  publishAnonymously: boolean
  isGuestAuthored: boolean
  status: Extract<StoryStatusDb, 'draft' | 'pending'>
}

const emptyReactionCounts: Record<ReactionType, number> = {
  understand: 0,
  sending_support: 0,
  not_alone: 0,
  stay_strong: 0,
  thank_you: 0,
}

interface RawCategoryRow {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
}

interface RawStoryRow {
  id: string
  author_id: string
  category_id: string | null
  title: string
  content: string
  excerpt: string | null
  status: StoryStatusDb
  content_warnings: string[]
  publish_anonymously: boolean
  is_guest_authored: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  categories: RawCategoryRow | RawCategoryRow[] | null
}

/**
 * Turns raw rows from `stories` (plus a few follow-up queries for tags,
 * reaction counts, comment counts, and author profiles) into the same
 * `Story` shape the Milestone 1 mock data already produces — so
 * StoryCard/StoryFeed/ReactionBar etc. render real data with zero changes.
 */
async function hydrateStories(rows: RawStoryRow[]): Promise<Story[]> {
  if (rows.length === 0) return []
  const storyIds = rows.map((r) => r.id)
  const authorIds = [...new Set(rows.map((r) => r.author_id))]

  const [{ data: tagRows }, { data: reactionRows }, { data: commentRows }, { data: profileRows }] = await Promise.all([
    supabase.from('story_tags').select('story_id, tags(*)').in('story_id', storyIds),
    supabase.from('reactions').select('story_id, reaction_type').in('story_id', storyIds),
    supabase.from('comments').select('story_id').in('story_id', storyIds).eq('is_removed', false),
    supabase.from('anonymous_profiles').select('user_id, display_name, avatar_color, is_verified_professional').in('user_id', authorIds),
  ])

  const tagsByStory = new Map<string, Tag[]>()
  for (const row of tagRows ?? []) {
    const tag = Array.isArray(row.tags) ? row.tags[0] : row.tags
    if (!tag) continue
    const list = tagsByStory.get(row.story_id) ?? []
    list.push(tag)
    tagsByStory.set(row.story_id, list)
  }

  const reactionsByStory = new Map<string, Record<ReactionType, number>>()
  for (const row of reactionRows ?? []) {
    const counts = reactionsByStory.get(row.story_id) ?? { ...emptyReactionCounts }
    counts[row.reaction_type as ReactionType] += 1
    reactionsByStory.set(row.story_id, counts)
  }

  const commentCountByStory = new Map<string, number>()
  for (const row of commentRows ?? []) {
    commentCountByStory.set(row.story_id, (commentCountByStory.get(row.story_id) ?? 0) + 1)
  }

  const profileByAuthor = new Map<string, AnonymousAuthor>()
  for (const profile of profileRows ?? []) {
    profileByAuthor.set(profile.user_id, {
      anonymousId: profile.user_id,
      displayName: profile.display_name,
      avatarColor: profile.avatar_color,
      isVerifiedProfessional: profile.is_verified_professional,
    })
  }

  return rows.map((row) => {
    const rawCategory = Array.isArray(row.categories) ? row.categories[0] : row.categories
    const category: Category = rawCategory
      ? {
          id: rawCategory.id,
          slug: rawCategory.slug,
          name: rawCategory.name,
          description: rawCategory.description ?? '',
          icon: rawCategory.icon ?? 'Heart',
          storyCount: 0,
        }
      : {
          id: 'uncategorized',
          slug: 'uncategorized',
          name: 'Uncategorized',
          description: '',
          icon: 'Heart',
          storyCount: 0,
        }
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt ?? row.content.slice(0, 160),
      author: profileByAuthor.get(row.author_id) ?? {
        anonymousId: row.author_id,
        displayName: 'Anonymous',
        avatarColor: '#6d4bd6',
        isVerifiedProfessional: false,
      },
      category,
      tags: tagsByStory.get(row.id) ?? [],
      status: row.status,
      contentWarnings: row.content_warnings,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      reactionCounts: reactionsByStory.get(row.id) ?? { ...emptyReactionCounts },
      commentCount: commentCountByStory.get(row.id) ?? 0,
      bookmarked: false,
    }
  })
}

export const storiesService = {
  async listPublished(limit = 20): Promise<Story[]> {
    const { data, error } = await supabase
      .from('stories')
      .select('*, categories(*)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return hydrateStories((data ?? []) as RawStoryRow[])
  },

  async getById(storyId: string): Promise<Story | null> {
    const { data, error } = await supabase.from('stories').select('*, categories(*)').eq('id', storyId).maybeSingle()
    if (error) throw error
    if (!data) return null
    const [story] = await hydrateStories([data as RawStoryRow])
    return story ?? null
  },

  async getByIds(storyIds: string[]): Promise<Story[]> {
    if (storyIds.length === 0) return []
    const { data, error } = await supabase.from('stories').select('*, categories(*)').in('id', storyIds)
    if (error) throw error
    return hydrateStories((data ?? []) as RawStoryRow[])
  },

  /** Moderator-only: lists stories by status across every author, for the moderation queue. */
  async listByStatus(status: StoryStatusDb): Promise<Story[]> {
    const { data, error } = await supabase
      .from('stories')
      .select('*, categories(*)')
      .eq('status', status)
      .order('created_at', { ascending: false })
    if (error) throw error
    return hydrateStories((data ?? []) as RawStoryRow[])
  },

  async listMine(authorId: string): Promise<Story[]> {
    const { data, error } = await supabase
      .from('stories')
      .select('*, categories(*)')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return hydrateStories((data ?? []) as RawStoryRow[])
  },

  async create(authorId: string, input: CreateStoryInput) {
    const { data: story, error } = await supabase
      .from('stories')
      .insert({
        author_id: authorId,
        category_id: input.categoryId,
        title: input.title,
        content: input.content,
        excerpt: input.excerpt ?? input.content.slice(0, 160),
        status: input.status,
        content_warnings: input.contentWarnings,
        publish_anonymously: input.publishAnonymously,
        is_guest_authored: input.isGuestAuthored,
      })
      .select()
      .single()
    if (error) throw error

    if (input.tagIds.length > 0) {
      const { error: tagError } = await supabase
        .from('story_tags')
        .insert(input.tagIds.map((tagId) => ({ story_id: story.id, tag_id: tagId })))
      if (tagError) throw tagError
    }

    return story
  },

  async update(storyId: string, input: Partial<CreateStoryInput>) {
    const { error } = await supabase
      .from('stories')
      .update({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.excerpt !== undefined && { excerpt: input.excerpt }),
        ...(input.categoryId !== undefined && { category_id: input.categoryId }),
        ...(input.contentWarnings !== undefined && { content_warnings: input.contentWarnings }),
        ...(input.publishAnonymously !== undefined && { publish_anonymously: input.publishAnonymously }),
        ...(input.status !== undefined && { status: input.status }),
      })
      .eq('id', storyId)
    if (error) throw error

    if (input.tagIds) {
      await supabase.from('story_tags').delete().eq('story_id', storyId)
      if (input.tagIds.length > 0) {
        await supabase.from('story_tags').insert(input.tagIds.map((tagId) => ({ story_id: storyId, tag_id: tagId })))
      }
    }
  },

  async delete(storyId: string) {
    const { error } = await supabase.from('stories').delete().eq('id', storyId)
    if (error) throw error
  },

  async issueGuestToken(storyId: string) {
    const { data, error } = await supabase.rpc('issue_guest_token', { p_story_id: storyId })
    if (error) throw error
    return data
  },

  async claimGuestStory(storyId: string, token: string) {
    const { data, error } = await supabase.rpc('claim_guest_story', {
      p_story_id: storyId,
      p_token: token,
    })
    if (error) throw error
    return data
  },
}

import type { Comment } from '@/types/domain'
import { makeAuthor } from './authors'
import { stories } from './stories'

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

const firstStoryId = stories[0]?.id ?? 'story-1'

export const comments: Comment[] = [
  {
    id: 'comment-1',
    storyId: firstStoryId,
    author: makeAuthor(101),
    content: 'Thank you for sharing this. I am in a very similar place right now and this gave me hope.',
    createdAt: daysAgoIso(1),
    parentId: null,
    replies: [
      {
        id: 'comment-2',
        storyId: firstStoryId,
        author: makeAuthor(102),
        content: 'Sending you strength. You are not alone in this.',
        createdAt: daysAgoIso(1),
        parentId: 'comment-1',
        replies: [],
      },
    ],
  },
  {
    id: 'comment-3',
    storyId: firstStoryId,
    author: makeAuthor(103),
    content: 'This is exactly how I felt before I finally made the decision to leave. It gets easier.',
    createdAt: daysAgoIso(2),
    parentId: null,
    replies: [],
  },
]

export function getCommentsForStory(storyId: string): Comment[] {
  return comments.filter((comment) => comment.storyId === storyId)
}

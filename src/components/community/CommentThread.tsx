import { Flag, Reply } from 'lucide-react'
import { useState } from 'react'
import { AnonymousAvatar } from '@/components/common/AnonymousAvatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatRelativeDate } from '@/lib/utils'
import type { Comment } from '@/types/domain'

export function CommentThread({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  const [replying, setReplying] = useState(false)
  const [draft, setDraft] = useState('')

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-surface-muted pl-4' : ''}>
      <div className="flex items-start justify-between">
        <AnonymousAvatar author={comment.author} size="sm" />
        <span className="text-xs text-text-muted">{formatRelativeDate(comment.createdAt)}</span>
      </div>
      <p className="mt-2 text-sm text-text-primary">{comment.content}</p>
      <div className="mt-2 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setReplying((v) => !v)}
          className="focus-ring inline-flex items-center gap-1 rounded text-xs font-medium text-text-secondary hover:text-primary-600"
        >
          <Reply className="size-3.5" /> Reply
        </button>
        <button
          type="button"
          className="focus-ring inline-flex items-center gap-1 rounded text-xs font-medium text-text-secondary hover:text-error-500"
        >
          <Flag className="size-3.5" /> Report
        </button>
      </div>

      {replying && (
        <div className="mt-3 flex flex-col gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a supportive reply…"
            className="min-h-16"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setReplying(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!draft.trim()} onClick={() => setReplying(false)}>
              Post Reply
            </Button>
          </div>
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          {comment.replies.map((reply) => (
            <CommentThread key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

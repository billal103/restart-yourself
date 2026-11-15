import { Check, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  content: string
  sentAt: string
  isOwn: boolean
  isRead?: boolean
}

export function MessageBubble({ content, sentAt, isOwn, isRead }: MessageBubbleProps) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
          isOwn ? 'bg-primary-500 text-white' : 'bg-surface text-text-primary',
        )}
      >
        <p className="whitespace-pre-line">{content}</p>
        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-[11px]',
            isOwn ? 'text-primary-100' : 'text-text-muted',
          )}
        >
          {new Date(sentAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          {isOwn && (isRead ? <CheckCheck className="size-3" /> : <Check className="size-3" />)}
        </div>
      </div>
    </div>
  )
}

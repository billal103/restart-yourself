import { ShieldCheck } from 'lucide-react'
import type { AnonymousAuthor } from '@/types/domain'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface AnonymousAvatarProps {
  author: AnonymousAuthor
  size?: 'sm' | 'md'
  showName?: boolean
  className?: string
}

export function AnonymousAvatar({
  author,
  size = 'md',
  showName = true,
  className,
}: AnonymousAvatarProps) {
  const initials = author.displayName.slice(0, 2).toUpperCase()
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Avatar className={size === 'sm' ? 'size-8' : 'size-10'}>
        <AvatarFallback style={{ backgroundColor: author.avatarColor }}>
          {initials}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-text-primary">
          {author.displayName}
          {author.isVerifiedProfessional && (
            <ShieldCheck className="size-3.5 text-primary-500" aria-label="Verified professional" />
          )}
        </span>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import type { ReactionType, Story } from '@/types/domain'
import { cn } from '@/lib/utils'
import { toast } from '@/stores/toastStore'

const reactionLabels: Record<ReactionType, string> = {
  understand: 'I understand',
  sending_support: 'Sending support',
  not_alone: 'You are not alone',
  stay_strong: 'Stay strong',
  thank_you: 'Thank you for sharing',
}

interface ReactionBarProps {
  reactionCounts: Story['reactionCounts']
  /** When both are set, reactions are persisted via Supabase instead of local-only state. */
  storyId?: string
  userId?: string
}

export function ReactionBar({ reactionCounts, storyId, userId }: ReactionBarProps) {
  const [active, setActive] = useState<ReactionType | null>(null)
  const [counts, setCounts] = useState(reactionCounts)
  const isReal = Boolean(storyId && userId)

  useEffect(() => {
    if (!isReal || !storyId || !userId) return
    void import('@/services/reactions.service').then(async ({ reactionsService }) => {
      const rows = await reactionsService.listForStory(storyId)
      const mine = rows.find((r) => r.user_id === userId)
      if (mine) setActive(mine.reaction_type as ReactionType)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, userId])

  async function toggle(type: ReactionType) {
    const turningOn = active !== type
    setCounts((prev) => ({
      ...prev,
      [type]: prev[type] + (active === type ? -1 : 1),
      ...(active && active !== type ? { [active]: prev[active] - 1 } : {}),
    }))
    setActive((prev) => (prev === type ? null : type))

    if (!isReal || !storyId || !userId) return
    try {
      const { reactionsService } = await import('@/services/reactions.service')
      if (active) await reactionsService.remove(storyId, userId, active)
      if (turningOn) await reactionsService.add(storyId, userId, type)
    } catch (error) {
      toast({
        title: 'Could not update reaction',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'error',
      })
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(reactionLabels).map(([type, label]) => {
        const reactionType = type as ReactionType
        const isActive = active === reactionType
        return (
          <button
            key={type}
            type="button"
            onClick={() => void toggle(reactionType)}
            className={cn(
              'focus-ring inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-surface-muted text-text-secondary hover:bg-surface',
            )}
          >
            {label}
            <span className="text-text-muted">{counts[reactionType]}</span>
          </button>
        )
      })}
    </div>
  )
}

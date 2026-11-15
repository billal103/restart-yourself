import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  children?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-surface-muted bg-surface/40 px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary-50">
        <Icon className="size-6 text-primary-500" />
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      <p className="max-w-sm text-sm text-text-secondary">{description}</p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
      {children}
    </div>
  )
}

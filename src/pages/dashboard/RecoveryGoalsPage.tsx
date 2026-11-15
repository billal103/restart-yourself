import { CheckCircle2, Circle, Plus, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { recoveryGoals as initialGoals } from '@/lib/mockData'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { RecoveryGoal } from '@/types/domain'
import { toast } from '@/stores/toastStore'

function progressOf(goal: RecoveryGoal): number {
  if (goal.milestones.length === 0) return goal.isComplete ? 100 : 0
  return Math.round((goal.milestones.filter((m) => m.isComplete).length / goal.milestones.length) * 100)
}

export default function RecoveryGoalsPage() {
  const user = useAuthStore((state) => state.user)
  const [goals, setGoals] = useState<RecoveryGoal[]>(isSupabaseConfigured ? [] : initialGoals)
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  async function loadGoals() {
    if (!isSupabaseConfigured || !user) return
    const { recoveryService } = await import('@/services/recovery.service')
    const rows = await recoveryService.listGoals(user.id)
    setGoals(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description ?? '',
        createdAt: r.created_at,
        targetDate: r.target_date,
        isComplete: r.is_complete,
        milestones: (r.goal_milestones ?? []).map((m) => ({ id: m.id, title: m.title, isComplete: m.is_complete })),
      })),
    )
  }

  useEffect(() => {
    void loadGoals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function toggleMilestone(goalId: string, milestoneId: string) {
    const goal = goals.find((g) => g.id === goalId)
    const milestone = goal?.milestones.find((m) => m.id === milestoneId)
    if (!milestone) return

    if (isSupabaseConfigured) {
      try {
        const { recoveryService } = await import('@/services/recovery.service')
        await recoveryService.toggleMilestone(milestoneId, !milestone.isComplete)
        await loadGoals()
      } catch (error) {
        toast({
          title: 'Could not update milestone',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
      }
      return
    }

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones.map((m) =>
                m.id === milestoneId ? { ...m, isComplete: !m.isComplete } : m,
              ),
            }
          : g,
      ),
    )
  }

  async function createGoal() {
    if (isSupabaseConfigured && user) {
      try {
        const { recoveryService } = await import('@/services/recovery.service')
        await recoveryService.createGoal(user.id, title, description)
        await loadGoals()
      } catch (error) {
        toast({
          title: 'Could not create goal',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
        return
      }
    } else {
      setGoals((prev) => [
        {
          id: crypto.randomUUID(),
          title,
          description,
          createdAt: new Date().toISOString(),
          targetDate: null,
          isComplete: false,
          milestones: [],
        },
        ...prev,
      ])
    }
    setTitle('')
    setDescription('')
    setCreateOpen(false)
    toast({ title: 'Goal created', variant: 'success' })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Recovery Goals</h1>
          <p className="mt-1 text-text-secondary">Set milestones and track real progress.</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> New Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Create your first recovery goal to start tracking progress." />
      ) : (
        <div className="flex flex-col gap-4">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">{goal.title}</h3>
                  {goal.isComplete && <Badge variant="success">Complete</Badge>}
                </div>
                <p className="mt-1 text-sm text-text-secondary">{goal.description}</p>
                <Progress value={progressOf(goal)} className="mt-3" />
                <p className="mt-1 text-xs text-text-muted">{progressOf(goal)}% complete</p>

                {goal.milestones.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2">
                    {goal.milestones.map((milestone) => (
                      <button
                        key={milestone.id}
                        type="button"
                        onClick={() => void toggleMilestone(goal.id, milestone.id)}
                        className="focus-ring flex items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-surface"
                      >
                        {milestone.isComplete ? (
                          <CheckCircle2 className="size-4 shrink-0 text-success-500" />
                        ) : (
                          <Circle className="size-4 shrink-0 text-text-muted" />
                        )}
                        <span
                          className={cn(
                            'text-sm',
                            milestone.isComplete ? 'text-text-muted line-through' : 'text-text-primary',
                          )}
                        >
                          {milestone.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Recovery Goal</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-title">Goal title</Label>
              <Input id="goal-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal-description">Description</Label>
              <Textarea id="goal-description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!title.trim()} onClick={() => void createGoal()}>
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

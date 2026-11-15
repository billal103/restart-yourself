import { useEffect, useState } from 'react'
import { MoodChart } from '@/components/recovery/MoodChart'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { moodEntries as initialEntries } from '@/lib/mockData'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { MoodEntry, MoodLevel } from '@/types/domain'
import { toast } from '@/stores/toastStore'

const moodLabels: Record<MoodLevel, string> = {
  1: 'Very difficult',
  2: 'Difficult',
  3: 'Neutral',
  4: 'Good',
  5: 'Very good',
}

const moodEmoji: Record<MoodLevel, string> = {
  1: '😞',
  2: '🙁',
  3: '😐',
  4: '🙂',
  5: '😄',
}

export default function MoodTrackerPage() {
  const user = useAuthStore((state) => state.user)
  const [entries, setEntries] = useState<MoodEntry[]>(isSupabaseConfigured ? [] : initialEntries)
  const [range, setRange] = useState<'week' | 'month'>('week')
  const today = new Date().toISOString().slice(0, 10)
  const todayEntry = entries.find((e) => e.date === today)

  async function loadEntries() {
    if (!isSupabaseConfigured || !user) return
    const { recoveryService } = await import('@/services/recovery.service')
    const rows = await recoveryService.listMoodEntries(user.id)
    setEntries(rows.map((r) => ({ id: r.id, date: r.entry_date, level: r.level as MoodLevel, note: r.note ?? '' })))
  }

  useEffect(() => {
    void loadEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const visibleEntries = entries.slice(range === 'week' ? -7 : -14)
  const average =
    visibleEntries.reduce((sum, e) => sum + e.level, 0) / (visibleEntries.length || 1)

  async function logMood(level: MoodLevel) {
    if (isSupabaseConfigured && user) {
      try {
        const { recoveryService } = await import('@/services/recovery.service')
        await recoveryService.upsertMoodEntry(user.id, today, level)
        await loadEntries()
      } catch (error) {
        toast({
          title: 'Could not log mood',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
        return
      }
    } else {
      setEntries((prev) => {
        const withoutToday = prev.filter((e) => e.date !== today)
        return [...withoutToday, { id: crypto.randomUUID(), date: today, level, note: '' }]
      })
    }
    toast({ title: `Mood logged: ${moodLabels[level]}`, variant: 'success' })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Mood Tracker</h1>
        <p className="mt-1 text-text-secondary">Check in with yourself — there's no wrong answer.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="font-semibold text-text-primary">How are you feeling today?</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => void logMood(level)}
                className={cn(
                  'focus-ring flex flex-col items-center gap-1 rounded-xl border px-4 py-3 text-sm transition-colors',
                  todayEntry?.level === level
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-surface-muted hover:bg-surface',
                )}
              >
                <span className="text-2xl">{moodEmoji[level]}</span>
                {moodLabels[level]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text-primary">Mood History</h2>
        <Tabs value={range} onValueChange={(v) => setRange(v as 'week' | 'month')}>
          <TabsList>
            <TabsTrigger value="week">Weekly</TabsTrigger>
            <TabsTrigger value="month">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-text-secondary">
            Average mood this {range}: <strong className="text-text-primary">{average.toFixed(1)}/5</strong>
          </p>
          <div className="mt-4">
            <MoodChart entries={visibleEntries} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="font-semibold text-text-primary">Mood Calendar</h2>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {entries.slice(-28).map((entry) => (
              <div
                key={entry.id}
                title={`${entry.date}: ${moodLabels[entry.level]}`}
                className="flex aspect-square items-center justify-center rounded-md text-lg"
                style={{
                  backgroundColor: `color-mix(in srgb, var(--color-primary-500) ${entry.level * 18}%, var(--color-surface))`,
                }}
              >
                {moodEmoji[entry.level]}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="self-start" disabled>
        Enable mood reminders (coming soon)
      </Button>
    </div>
  )
}

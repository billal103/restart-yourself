import { BookHeart, Bookmark, Heart, MessageCircle, Smile, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  conversations,
  journalEntries,
  moodEntries,
  recoveryGoals,
  stories,
} from '@/lib/mockData'
import { formatRelativeDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export default function UserDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const myStories = stories.slice(0, 3)
  const latestMood = moodEntries[moodEntries.length - 1]
  const activeGoal = recoveryGoals.find((g) => !g.isComplete)
  const goalProgress = activeGoal
    ? Math.round(
        (activeGoal.milestones.filter((m) => m.isComplete).length / activeGoal.milestones.length) * 100,
      )
    : 0

  const quickStats = [
    { icon: BookHeart, label: 'Stories shared', value: myStories.length },
    { icon: Heart, label: 'Support received', value: 142 },
    { icon: Bookmark, label: 'Saved stories', value: stories.filter((s) => s.bookmarked).length },
    { icon: MessageCircle, label: 'Conversations', value: conversations.length },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome back, {user?.anonymousDisplayName ?? 'friend'}
        </h1>
        <p className="mt-1 text-text-secondary">Here's a look at your journey so far.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col gap-2 pt-6">
              <stat.icon className="size-5 text-primary-500" />
              <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-secondary">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text-primary">Recovery Progress</h2>
              <Link to="/dashboard/goals" className="text-xs text-primary-600 hover:underline">
                View all goals
              </Link>
            </div>
            {activeGoal ? (
              <div className="mt-4">
                <p className="text-sm font-medium text-text-primary">{activeGoal.title}</p>
                <Progress value={goalProgress} className="mt-2" />
                <p className="mt-1 text-xs text-text-muted">{goalProgress}% complete</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-text-secondary">No active goals yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text-primary">Mood Summary</h2>
              <Link to="/dashboard/mood" className="text-xs text-primary-600 hover:underline">
                View mood tracker
              </Link>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Smile className="size-8 text-primary-500" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Last check-in: level {latestMood?.level ?? '—'}/5
                </p>
                <p className="text-xs text-text-muted">{moodEntries.length} entries logged</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold text-text-primary">Recent Conversations</h2>
            <div className="mt-4 flex flex-col gap-3">
              {conversations.slice(0, 3).map((conv) => (
                <Link
                  key={conv.id}
                  to={`/dashboard/messages/${conv.id}`}
                  className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-surface"
                >
                  <span className="text-sm text-text-primary">{conv.participant.displayName}</span>
                  <span className="text-xs text-text-muted">
                    {formatRelativeDate(conv.lastMessageAt)}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold text-text-primary">Recent Journal Entries</h2>
            <div className="mt-4 flex flex-col gap-3">
              {journalEntries.slice(0, 3).map((entry) => (
                <div key={entry.id} className="rounded-lg px-2 py-2">
                  <p className="text-sm font-medium text-text-primary">{entry.title}</p>
                  <p className="text-xs text-text-muted">{formatRelativeDate(entry.createdAt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/dashboard/stories/new">Share a New Story</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/dashboard/journal">
            <Target className="mr-1 size-4" /> Open Journal
          </Link>
        </Button>
      </div>
    </div>
  )
}

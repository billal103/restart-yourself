import {
  AlertOctagon,
  Flag,
  MessageSquare,
  ShieldCheck,
  Users,
  UsersRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { adminStats as mockStats, auditLogs as mockAuditLogs } from '@/lib/mockData/admin'
import { formatRelativeDate } from '@/lib/utils'
import type { AdminStats, AuditLogEntry } from '@/types/domain'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>(mockStats)
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>(mockAuditLogs)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void (async () => {
      const { moderationService } = await import('@/services/moderation.service')
      const [liveStats, logs] = await Promise.all([
        moderationService.getAdminStats(),
        moderationService.listAuditLogs(5),
      ])
      setStats(liveStats)
      setRecentActivity(logs)
    })()
  }, [])

  const statCards = [
    { icon: Users, label: 'Registered Users', value: stats.registeredUsers },
    { icon: UsersRound, label: 'Guest Users', value: stats.guestUsers },
    { icon: ShieldCheck, label: 'Published Stories', value: stats.publishedStories },
    { icon: AlertOctagon, label: 'Pending Stories', value: stats.pendingStories },
    { icon: Flag, label: 'Reported Stories', value: stats.reportedStories },
    { icon: MessageSquare, label: 'Message Reports', value: stats.messageReports },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Admin Overview</h1>
        {!isSupabaseConfigured && <Badge variant="warning">Demo statistics</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col gap-2 pt-6">
              <stat.icon className="size-5 text-primary-500" />
              <p className="text-2xl font-bold text-text-primary">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-text-secondary">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="font-semibold text-text-primary">Recent Moderation Activity</h2>
          <div className="mt-4 flex flex-col divide-y divide-surface-muted">
            {recentActivity.length === 0 && (
              <p className="py-3 text-sm text-text-muted">No moderation activity yet.</p>
            )}
            {recentActivity.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <span className="font-medium text-text-primary">{log.actor}</span>{' '}
                  <span className="text-text-secondary">{log.action.toLowerCase()}</span>{' '}
                  <span className="text-text-muted">{log.target}</span>
                </div>
                <span className="text-xs text-text-muted">{formatRelativeDate(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

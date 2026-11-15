import { Flag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { formatRelativeDate } from '@/lib/utils'
import { toast } from '@/stores/toastStore'
import type { CommunicationReportItem } from '@/types/domain'

const mockReports: CommunicationReportItem[] = [
  {
    id: 'report-1',
    targetType: 'conversation',
    targetId: 'conv-1',
    reason: 'Repeated unwanted messages after being asked to stop.',
    status: 'open',
    reporterName: 'A community member',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'report-2',
    targetType: 'message',
    targetId: 'conv-2',
    reason: 'Asked for personal contact information outside the platform.',
    status: 'open',
    reporterName: 'A community member',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
]

export default function MessageReportsPage() {
  const [reports, setReports] = useState<CommunicationReportItem[]>(isSupabaseConfigured ? [] : mockReports)

  async function load() {
    if (!isSupabaseConfigured) return
    const { moderationService } = await import('@/services/moderation.service')
    setReports(await moderationService.listCommunicationReports(['message', 'conversation']))
  }

  useEffect(() => {
    void (async () => {
      await load()
    })()
  }, [])

  async function resolve(report: CommunicationReportItem) {
    if (isSupabaseConfigured) {
      try {
        const { moderationService } = await import('@/services/moderation.service')
        await moderationService.resolveCommunicationReport(report.id, report.targetType, report.targetId)
        await load()
      } catch (error) {
        toast({ title: 'Could not resolve report', description: error instanceof Error ? error.message : 'Please try again.', variant: 'error' })
        return
      }
    } else {
      setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, status: 'resolved' as const } : r)))
    }
    toast({ title: 'Report resolved', variant: 'success' })
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-primary">Message Reports</h1>
      <p className="text-text-secondary">
        Reported private conversations. Only report metadata and the flagged content are visible
        here — full conversation history is accessible only with documented escalation.
      </p>

      {reports.length === 0 ? (
        <EmptyState icon={Flag} title="No open reports" description="Message reports will appear here." />
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{report.targetType}</Badge>
                    <Badge variant={report.status === 'open' ? 'warning' : 'success'}>
                      {report.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{report.reason}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Reported by {report.reporterName} · {formatRelativeDate(report.createdAt)}
                  </p>
                </div>
                {report.status === 'open' && (
                  <Button size="sm" onClick={() => void resolve(report)}>
                    Mark Resolved
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

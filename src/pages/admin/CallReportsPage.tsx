import { PhoneMissed } from 'lucide-react'
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
    id: 'call-report-1',
    targetType: 'call',
    targetId: 'call-1',
    reason: 'Repeated unsolicited call attempts after being declined twice.',
    status: 'open',
    reporterName: 'A community member',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
]

export default function CallReportsPage() {
  const [reports, setReports] = useState<CommunicationReportItem[]>(isSupabaseConfigured ? [] : mockReports)

  async function load() {
    if (!isSupabaseConfigured) return
    const { moderationService } = await import('@/services/moderation.service')
    setReports(await moderationService.listCommunicationReports(['call']))
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
      <h1 className="text-2xl font-bold text-text-primary">Call &amp; Communication Reports</h1>
      <p className="text-text-secondary">
        Calls are never recorded by default. Reports here are based on call metadata (participants,
        duration, timestamps) and the reporter's written description — not call content.
      </p>

      {reports.length === 0 ? (
        <EmptyState icon={PhoneMissed} title="No call reports" description="Reported calls will appear here." />
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">call</Badge>
                    <Badge variant={report.status === 'open' ? 'warning' : 'success'}>{report.status}</Badge>
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

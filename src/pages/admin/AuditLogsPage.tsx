import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { auditLogs as mockAuditLogs } from '@/lib/mockData/admin'
import { formatRelativeDate } from '@/lib/utils'
import type { AuditLogEntry } from '@/types/domain'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>(isSupabaseConfigured ? [] : mockAuditLogs)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void (async () => {
      const { moderationService } = await import('@/services/moderation.service')
      setLogs(await moderationService.listAuditLogs(100))
    })()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-primary">Audit Logs</h1>
      <p className="text-text-secondary">
        An immutable record of moderation and administrative actions, for accountability and
        review.
      </p>

      <div className="overflow-x-auto rounded-card border border-surface-muted">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs font-semibold uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-muted">
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-text-muted">
                  No moderation actions recorded yet.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 font-medium text-text-primary">{log.actor}</td>
                <td className="px-4 py-3 text-text-secondary">{log.action}</td>
                <td className="px-4 py-3 text-text-muted">{log.target}</td>
                <td className="px-4 py-3 text-text-muted">{formatRelativeDate(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { Bell, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { notifications as initialNotifications } from '@/lib/mockData'
import { cn, formatRelativeDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { NotificationItem } from '@/types/domain'

const preferenceKeys: { key: 'messages' | 'reactions' | 'groups' | 'calls' | 'recovery'; label: string }[] = [
  { key: 'messages', label: 'New messages and message requests' },
  { key: 'reactions', label: 'Reactions and comments on my stories' },
  { key: 'groups', label: 'Group discussion activity' },
  { key: 'calls', label: 'Call requests' },
  { key: 'recovery', label: 'Recovery reminders' },
]

export default function NotificationCenterPage() {
  const user = useAuthStore((state) => state.user)
  const [notifications, setNotifications] = useState<NotificationItem[]>(isSupabaseConfigured ? [] : initialNotifications)
  const [preferences, setPreferences] = useState<Record<string, boolean>>(
    Object.fromEntries(preferenceKeys.map((p) => [p.key, true])),
  )

  async function loadNotifications() {
    if (!isSupabaseConfigured || !user) return
    const { notificationsService } = await import('@/services/notifications.service')
    const [rows, prefs] = await Promise.all([
      notificationsService.list(user.id),
      notificationsService.getPreferences(user.id).catch(() => null),
    ])
    setNotifications(
      rows.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        body: r.body,
        createdAt: r.created_at,
        isRead: r.is_read,
      })),
    )
    if (prefs) {
      setPreferences({
        messages: prefs.messages,
        reactions: prefs.reactions,
        groups: prefs.groups,
        calls: prefs.calls,
        recovery: prefs.recovery,
      })
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return
    let unsubscribe: (() => void) | undefined
    void loadNotifications()
    void import('@/services/notifications.service').then(({ notificationsService }) => {
      unsubscribe = notificationsService.subscribe(user.id, () => void loadNotifications())
    })
    return () => unsubscribe?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function markAllRead() {
    if (isSupabaseConfigured && user) {
      const { notificationsService } = await import('@/services/notifications.service')
      await notificationsService.markAllRead(user.id)
      await loadNotifications()
      return
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  async function updatePreference(key: string, checked: boolean) {
    setPreferences((prev) => ({ ...prev, [key]: checked }))
    if (isSupabaseConfigured && user) {
      const { notificationsService } = await import('@/services/notifications.service')
      await notificationsService.updatePreferences(user.id, { [key]: checked })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
        <Button variant="outline" size="sm" onClick={() => void markAllRead()}>
          <Check className="size-4" /> Mark all as read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" description="New notifications will appear here." />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(!notification.isRead && 'border-primary-200 bg-primary-50/40')}
            >
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div>
                  <p className="font-medium text-text-primary">{notification.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">{notification.body}</p>
                  <p className="mt-2 text-xs text-text-muted">
                    {formatRelativeDate(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary-500" />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <h2 className="font-semibold text-text-primary">Notification Preferences</h2>
          <div className="mt-4 flex flex-col gap-4">
            {preferenceKeys.map((pref) => (
              <div key={pref.key} className="flex items-center justify-between">
                <Label htmlFor={pref.key} className="font-normal">
                  {pref.label}
                </Label>
                <Switch
                  id={pref.key}
                  checked={preferences[pref.key]}
                  onCheckedChange={(checked) => void updatePreference(pref.key, checked)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

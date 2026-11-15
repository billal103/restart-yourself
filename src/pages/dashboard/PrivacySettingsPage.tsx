import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SettingsTabs } from '@/components/common/SettingsTabs'
import { AnonymousAvatar } from '@/components/common/AnonymousAvatar'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { makeAuthor } from '@/lib/mockData'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import type { AnonymousAuthor } from '@/types/domain'

const togglePreferences = [
  { key: 'allow_messages', label: 'Allow message requests from other members', defaultValue: true },
  { key: 'allow_calls', label: 'Allow voice and video call requests', defaultValue: true },
  { key: 'show_online_status', label: "Show online status to people I've messaged", defaultValue: false },
  { key: 'ai_moderation_assist', label: 'Let AI-assisted moderation pre-screen content I report', defaultValue: true },
] as const

const mockBlockedUsers = [makeAuthor(777), makeAuthor(778)]

export default function PrivacySettingsPage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const [preferences, setPreferences] = useState<Record<string, boolean>>(
    Object.fromEntries(togglePreferences.map((p) => [p.key, p.defaultValue])),
  )
  const [blockedUsers, setBlockedUsers] = useState<(AnonymousAuthor & { blockedId?: string })[]>(mockBlockedUsers)
  const [exporting, setExporting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function loadBlocked() {
    if (!isSupabaseConfigured || !user) return
    const { socialService } = await import('@/services/social.service')
    const rows = await socialService.listMyBlocks(user.id)
    setBlockedUsers(
      rows.map((r) => {
        const profile = Array.isArray(r.anonymous_profiles) ? r.anonymous_profiles[0] : r.anonymous_profiles
        return {
          anonymousId: r.blocked_id,
          blockedId: r.blocked_id,
          displayName: profile?.display_name ?? 'Anonymous',
          avatarColor: profile?.avatar_color ?? '#6d4bd6',
          isVerifiedProfessional: false,
        }
      }),
    )
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return
    void (async () => {
      const { profileService } = await import('@/services/profile.service')
      const prefs = await profileService.getPreferences(user.id)
      setPreferences({
        allow_messages: prefs.allow_messages,
        allow_calls: prefs.allow_calls,
        show_online_status: prefs.show_online_status,
        ai_moderation_assist: prefs.ai_moderation_assist,
      })
    })()
    void loadBlocked()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function updatePreference(key: string, checked: boolean) {
    setPreferences((prev) => ({ ...prev, [key]: checked }))
    if (isSupabaseConfigured && user) {
      try {
        const { profileService } = await import('@/services/profile.service')
        await profileService.updatePreferences(user.id, { [key]: checked })
      } catch (error) {
        toast({
          title: 'Could not update preference',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
      }
    }
  }

  async function handleUnblock(blockedId?: string) {
    if (isSupabaseConfigured && user && blockedId) {
      try {
        const { socialService } = await import('@/services/social.service')
        await socialService.unblockUser(user.id, blockedId)
        await loadBlocked()
      } catch (error) {
        toast({
          title: 'Could not unblock user',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'error',
        })
        return
      }
    } else {
      setBlockedUsers((prev) => prev.filter((u) => u.anonymousId !== blockedId))
    }
    toast({ title: 'User unblocked', variant: 'success' })
  }

  async function handleExport() {
    setExporting(true)
    try {
      let payload: unknown
      if (isSupabaseConfigured && user) {
        const { profileService } = await import('@/services/profile.service')
        payload = await profileService.exportMyData(user.id)
      } else {
        payload = { exportedAt: new Date().toISOString(), note: 'Mock-mode export — connect a real backend for real data.' }
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `restart-yourself-data-export-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast({ title: 'Export ready', description: 'Your data download has started.', variant: 'success' })
    } catch (error) {
      toast({ title: 'Could not export your data', description: error instanceof Error ? error.message : 'Please try again.', variant: 'error' })
    } finally {
      setExporting(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      if (isSupabaseConfigured) {
        const { profileService } = await import('@/services/profile.service')
        await profileService.deleteOwnAccount()
      }
      await logout()
      toast({ title: 'Account deleted', description: 'Your account and data have been removed.', variant: 'success' })
      navigate('/')
    } catch (error) {
      toast({ title: 'Could not delete your account', description: error instanceof Error ? error.message : 'Please try again.', variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      <SettingsTabs />

      <Card className="mt-6">
        <CardContent className="flex flex-col gap-4 pt-6">
          <h2 className="font-semibold text-text-primary">Communication Privacy</h2>
          {togglePreferences.map((pref) => (
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
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <h2 className="font-semibold text-text-primary">Blocked Users</h2>
          {blockedUsers.length === 0 ? (
            <p className="mt-2 text-sm text-text-muted">You haven't blocked anyone.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {blockedUsers.map((blockedUser) => (
                <div key={blockedUser.anonymousId} className="flex items-center justify-between">
                  <AnonymousAvatar author={blockedUser} size="sm" />
                  <Button variant="outline" size="sm" onClick={() => void handleUnblock(blockedUser.blockedId ?? blockedUser.anonymousId)}>
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <h2 className="font-semibold text-text-primary">Your Data</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Download a copy of your data or request account deletion. Private journal entries are
            never used for AI training without your explicit consent. See our{' '}
            <a href="/data-retention" className="underline">
              Data Retention
            </a>{' '}
            and{' '}
            <a href="/account-deletion" className="underline">
              Account Deletion
            </a>{' '}
            policies for exactly what is kept and what is removed.
          </p>
          <div className="mt-4 flex gap-3">
            <Button variant="outline" disabled={exporting} onClick={() => void handleExport()}>
              {exporting ? 'Preparing export…' : 'Export My Data'}
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              Delete My Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete your account?"
        description="This permanently deletes your profile, stories, journal entries, mood logs, recovery goals, and messages. This cannot be undone. Moderation and audit records about you are kept but anonymized, per our Account Deletion Policy."
        confirmLabel={deleting ? 'Deleting…' : 'Delete My Account'}
        destructive
        onConfirm={() => void handleDeleteAccount()}
      />
    </div>
  )
}

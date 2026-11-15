import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SettingsTabs } from '@/components/common/SettingsTabs'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'

export default function ProfileSettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [displayName, setDisplayName] = useState(user?.anonymousDisplayName ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      if (isSupabaseConfigured) {
        const { profileService } = await import('@/services/profile.service')
        await profileService.updateDisplayName(user.id, displayName)
      }
      toast({ title: 'Profile updated', variant: 'success' })
    } catch (error) {
      toast({
        title: 'Could not update profile',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>

      <SettingsTabs />

      <Card className="mt-6">
        <CardContent className="flex flex-col gap-5 pt-6">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary-500 text-xl font-semibold text-white">
              {displayName.slice(0, 2).toUpperCase() || '??'}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Anonymous Display Name</p>
              <p className="text-xs text-text-muted">This is what other members see — never your real name.</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Account Email</Label>
            <Input id="email" value={user?.email ?? 'guest (no email on file)'} disabled />
            <p className="text-xs text-text-muted">
              Used only for account access. Never shown publicly.
            </p>
          </div>

          <Button className="self-start" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="font-medium text-text-primary">Log Out</p>
            <p className="text-xs text-text-secondary">Sign out of this device.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" /> Log Out
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6 border-error-500/30">
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="font-medium text-text-primary">Delete Account</p>
            <p className="text-xs text-text-secondary">
              Permanently delete your account and associated data, subject to our retention policy.
            </p>
          </div>
          <Button variant="destructive" size="sm">
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from '@/stores/toastStore'

const platformToggles = [
  { key: 'guestPublishing', label: 'Allow guest (unregistered) story publishing', defaultValue: true },
  { key: 'aiModerationAssist', label: 'Enable AI-assisted pre-screening of reports', defaultValue: true },
  { key: 'professionalApplications', label: 'Accept new professional verification applications', defaultValue: true },
  { key: 'newGroupCreation', label: 'Allow moderators to create new community groups', defaultValue: false },
]

export default function PlatformSettingsPage() {
  const [toggles, setToggles] = useState(
    Object.fromEntries(platformToggles.map((t) => [t.key, t.defaultValue])),
  )

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-primary">Platform Settings</h1>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          {platformToggles.map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between">
              <Label htmlFor={toggle.key} className="font-normal">
                {toggle.label}
              </Label>
              <Switch
                id={toggle.key}
                checked={toggles[toggle.key]}
                onCheckedChange={(checked) => setToggles((prev) => ({ ...prev, [toggle.key]: checked }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button className="self-start" onClick={() => toast({ title: 'Platform settings saved', variant: 'success' })}>
        Save Settings
      </Button>
    </div>
  )
}

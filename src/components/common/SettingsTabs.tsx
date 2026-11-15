import { Link, useLocation } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const tabs = [
  { to: '/dashboard/settings/profile', label: 'Profile' },
  { to: '/dashboard/settings/privacy', label: 'Privacy' },
  { to: '/dashboard/settings/language', label: 'Language' },
]

export function SettingsTabs() {
  const location = useLocation()
  return (
    <Tabs value={location.pathname} className="mt-6">
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.to} value={tab.to} asChild>
            <Link to={tab.to}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

import {
  BookHeart,
  Bookmark,
  Compass,
  Flag,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Smile,
  Target,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function DashboardSidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()

  const links = [
    { to: '/dashboard', label: t('dashboardNav.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/dashboard/stories', label: t('dashboardNav.myStories'), icon: BookHeart },
    { to: '/dashboard/saved', label: t('dashboardNav.savedStories'), icon: Bookmark },
    { to: '/dashboard/journal', label: t('dashboardNav.privateJournal'), icon: Compass },
    { to: '/dashboard/mood', label: t('dashboardNav.moodTracker'), icon: Smile },
    { to: '/dashboard/goals', label: t('dashboardNav.recoveryGoals'), icon: Target },
    { to: '/dashboard/messages', label: t('dashboardNav.conversations'), icon: MessageCircle },
    { to: '/dashboard/notifications', label: t('dashboardNav.notifications'), icon: Flag },
    { to: '/dashboard/settings/profile', label: t('dashboardNav.settings'), icon: Settings },
  ]

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-text-secondary hover:bg-surface hover:text-text-primary',
            )
          }
        >
          <Icon className="size-[18px]" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

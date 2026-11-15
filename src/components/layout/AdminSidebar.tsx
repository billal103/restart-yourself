import {
  FileWarning,
  Flag,
  Globe,
  LayoutDashboard,
  MessageSquareWarning,
  PhoneMissed,
  ScrollText,
  Settings,
  Tags,
  UserCheck,
  Users,
  UsersRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function AdminSidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()

  const links = [
    { to: '/admin', label: t('adminNav.overview'), icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: t('adminNav.userManagement'), icon: Users },
    { to: '/admin/stories', label: t('adminNav.storyModeration'), icon: FileWarning },
    { to: '/admin/comments', label: t('adminNav.commentModeration'), icon: MessageSquareWarning },
    { to: '/admin/reports/messages', label: t('adminNav.messageReports'), icon: Flag },
    { to: '/admin/reports/calls', label: t('adminNav.callReports'), icon: PhoneMissed },
    { to: '/admin/categories', label: t('adminNav.categoryManagement'), icon: Tags },
    { to: '/admin/communities', label: t('adminNav.communityManagement'), icon: UsersRound },
    { to: '/admin/professionals', label: t('adminNav.professionalManagement'), icon: UserCheck },
    { to: '/admin/resources', label: t('adminNav.resourceManagement'), icon: Globe },
    { to: '/admin/settings', label: t('adminNav.platformSettings'), icon: Settings },
    { to: '/admin/audit-logs', label: t('adminNav.auditLogs'), icon: ScrollText },
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

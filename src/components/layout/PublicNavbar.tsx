import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

export function PublicNavbar() {
  const [open, setOpen] = useState(false)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { t } = useTranslation()

  const navLinks = [
    { to: '/feed', label: t('nav.community') },
    { to: '/explore', label: t('nav.explore') },
    { to: '/groups', label: t('nav.groups') },
    { to: '/resources', label: t('nav.resources') },
    { to: '/how-it-works', label: t('nav.howItWorks') },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-surface-muted bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary-700">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary-500 text-sm text-white">
            RY
          </span>
          Restart Yourself
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-primary-600' : 'text-text-secondary hover:text-text-primary'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard">{t('nav.dashboard')}</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">{t('nav.login')}</Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link to="/dashboard/stories/new">{t('nav.shareStory')}</Link>
          </Button>
        </div>

        <button
          type="button"
          className="focus-ring rounded-md p-2 text-text-primary lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={t('nav.toggleMenu')}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-surface-muted bg-background px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {isAuthenticated ? (
                <Button asChild variant="outline" size="sm" onClick={() => setOpen(false)}>
                  <Link to="/dashboard">{t('nav.dashboard')}</Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  <Link to="/login">{t('nav.login')}</Link>
                </Button>
              )}
              <Button asChild size="sm" onClick={() => setOpen(false)}>
                <Link to="/dashboard/stories/new">{t('nav.shareStory')}</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

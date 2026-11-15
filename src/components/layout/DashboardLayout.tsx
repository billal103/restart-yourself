import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, Outlet } from 'react-router-dom'
import { IncomingCallListener } from '@/components/calling/IncomingCallListener'
import { useAuthStore } from '@/stores/authStore'
import { DashboardSidebarLinks } from './DashboardSidebar'

export function DashboardLayout() {
  const [open, setOpen] = useState(false)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-surface-muted p-4 lg:block">
        <Link to="/" className="mb-6 flex items-center gap-2 px-2 text-lg font-bold text-primary-700">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary-500 text-sm text-white">
            RY
          </span>
          Restart Yourself
        </Link>
        <DashboardSidebarLinks />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-background p-4 shadow-elevated">
            <div className="mb-6 flex items-center justify-between px-2">
              <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary-700">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary-500 text-sm text-white">
                  RY
                </span>
                Restart Yourself
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="focus-ring rounded-md p-1"
              >
                <X className="size-5" />
              </button>
            </div>
            <DashboardSidebarLinks onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-surface-muted px-4 lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="focus-ring rounded-md p-2"
          >
            <Menu className="size-5" />
          </button>
          <span className="ml-3 font-semibold text-text-primary">Dashboard</span>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <IncomingCallListener />
    </div>
  )
}

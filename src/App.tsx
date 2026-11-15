import { Suspense, useEffect } from 'react'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toast'
import { AppRoutes } from '@/routes/AppRoutes'
import { useAuthStore } from '@/stores/authStore'

// Hash-based routing is used only for static preview hosting (e.g. a sandboxed
// artifact iframe) where History API navigation to clean URLs isn't reliable.
// Normal dev/production builds use BrowserRouter for clean URLs.
const Router = import.meta.env.VITE_USE_HASH_ROUTER === 'true' ? HashRouter : BrowserRouter

function PageLoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="size-8 animate-spin rounded-full border-2 border-surface-muted border-t-primary-500"
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}

export default function App() {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    void initialize()
  }, [initialize])

  return (
    <Router>
      <TooltipProvider delayDuration={200}>
        <Suspense fallback={<PageLoadingFallback />}>
          <AppRoutes />
        </Suspense>
        <Toaster />
      </TooltipProvider>
    </Router>
  )
}

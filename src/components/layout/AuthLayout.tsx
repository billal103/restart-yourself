import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary-700">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary-500 text-sm text-white">
            RY
          </span>
          Restart Yourself
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

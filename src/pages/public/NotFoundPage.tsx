import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-5xl font-bold text-primary-500">404</h1>
      <h2 className="text-xl font-semibold text-text-primary">Page not found</h2>
      <p className="text-text-secondary">
        The page you are looking for doesn't exist or may have moved.
      </p>
      <Button asChild>
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  )
}

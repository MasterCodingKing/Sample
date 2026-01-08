import { Link } from 'react-router-dom'
import { HomeIcon } from '@heroicons/react/24/outline'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">Page Not Found</h2>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="btn btn-primary inline-flex items-center gap-2 mt-8"
        >
          <HomeIcon className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

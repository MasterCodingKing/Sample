import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { officialService } from '../../services/otherServices'
import type { Official } from '../../types'
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function Officials() {
  const [officials, setOfficials] = useState<Official[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCurrent, setShowCurrent] = useState(true)

  const positions = officialService.getPositions()

  useEffect(() => {
    const fetchOfficials = async () => {
      setIsLoading(true)
      try {
        const data = await officialService.getAll({ is_current: showCurrent })
        setOfficials(data)
      } catch (error) {
        console.error('Failed to fetch officials:', error)
        toast.error('Failed to load officials')
      } finally {
        setIsLoading(false)
      }
    }
    fetchOfficials()
  }, [showCurrent])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this official?')) return

    try {
      await officialService.delete(id)
      toast.success('Official deleted successfully')
      setOfficials(officials.filter((o) => o.id !== id))
    } catch {
      toast.error('Failed to delete official')
    }
  }

  const getPositionLabel = (position: string) => {
    return positions.find((p) => p.value === position)?.label || position
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Barangay Officials</h1>
          <p className="text-gray-500 mt-1">Manage elected and appointed officials</p>
        </div>
        <Link to="/officials/new" className="btn btn-primary inline-flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Add Official
        </Link>
      </div>

      {/* Filter */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Show:</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="showCurrent"
              checked={showCurrent}
              onChange={() => setShowCurrent(true)}
              className="w-4 h-4 text-primary-600"
            />
            <span className="text-sm text-gray-600">Current Officials</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="showCurrent"
              checked={!showCurrent}
              onChange={() => setShowCurrent(false)}
              className="w-4 h-4 text-primary-600"
            />
            <span className="text-sm text-gray-600">Past Officials</span>
          </label>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
        </div>
      ) : officials.length === 0 ? (
        <div className="card text-center py-12">
          <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No officials found</h3>
          <p className="text-gray-500 mb-4">Add barangay officials to get started</p>
          <Link to="/officials/new" className="btn btn-primary inline-flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Add Official
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {officials.map((official) => (
            <div key={official.id} className="card text-center">
              {/* Photo */}
              <div className="w-24 h-24 rounded-full bg-primary-100 mx-auto mb-4 flex items-center justify-center overflow-hidden">
                {official.photo_url ? (
                  <img
                    src={official.photo_url}
                    alt={official.resident?.first_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-primary-600">
                    {official.resident?.first_name?.[0]}
                    {official.resident?.last_name?.[0]}
                  </span>
                )}
              </div>

              {/* Name & Position */}
              <h3 className="text-lg font-semibold text-gray-900">
                {official.resident?.first_name} {official.resident?.last_name}
              </h3>
              <p className="text-primary-600 font-medium">{getPositionLabel(official.position)}</p>
              {official.committee && (
                <p className="text-sm text-gray-500 mt-1">{official.committee}</p>
              )}

              {/* Term */}
              <div className="mt-3 text-sm text-gray-500">
                Term: {new Date(official.term_start).getFullYear()} -{' '}
                {official.term_end ? new Date(official.term_end).getFullYear() : 'Present'}
              </div>

              {/* Contact */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                {official.resident?.contact_number && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <PhoneIcon className="w-4 h-4" />
                    <span>{official.resident.contact_number}</span>
                  </div>
                )}
                {official.resident?.email && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <EnvelopeIcon className="w-4 h-4" />
                    <span className="truncate">{official.resident.email}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <Link
                  to={`/officials/${official.id}`}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                >
                  <EyeIcon className="w-5 h-5" />
                </Link>
                <Link
                  to={`/officials/${official.id}/edit`}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                >
                  <PencilIcon className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => handleDelete(official.id)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

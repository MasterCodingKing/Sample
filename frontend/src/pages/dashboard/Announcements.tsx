import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { announcementService } from '../../services/otherServices'
import type { Announcement, PaginatedResponse } from '../../types'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true)
    try {
      const response: PaginatedResponse<Announcement> = await announcementService.getAll({
        page,
        limit: 10,
      })
      setAnnouncements(response.data || response.announcements || [])
      setPagination({
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
        pages: response.pages || 1,
      })
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
      toast.error('Failed to load announcements')
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      await announcementService.delete(id)
      toast.success('Announcement deleted successfully')
      fetchAnnouncements()
    } catch {
      toast.error('Failed to delete announcement')
    }
  }

  const handlePublish = async (id: number) => {
    try {
      await announcementService.publish(id)
      toast.success('Announcement published successfully')
      fetchAnnouncements()
    } catch {
      toast.error('Failed to publish announcement')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="badge badge-green">Published</span>
      case 'draft':
        return <span className="badge badge-gray">Draft</span>
      case 'archived':
        return <span className="badge badge-yellow">Archived</span>
      default:
        return <span className="badge badge-gray">{status}</span>
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 mt-1">Manage barangay announcements</p>
        </div>
        <Link to="/announcements/new" className="btn btn-primary inline-flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          New Announcement
        </Link>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search announcements..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="card text-center py-12">
          <MegaphoneIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
          <p className="text-gray-500 mb-4">Create your first announcement</p>
          <Link to="/announcements/new" className="btn btn-primary inline-flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            New Announcement
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAnnouncements.map((announcement) => (
            <div key={announcement.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusBadge(announcement.status)}
                  {announcement.category && (
                    <span className="badge badge-blue capitalize">{announcement.category}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    to={`/announcements/${announcement.id}`}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </Link>
                  <Link
                    to={`/announcements/${announcement.id}/edit`}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{announcement.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-3 mb-4">{announcement.content}</p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-500">{formatDate(announcement.created_at)}</span>
                {announcement.status === 'draft' && (
                  <button
                    onClick={() => handlePublish(announcement.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center mt-6 gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="btn btn-outline btn-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.pages}
            className="btn btn-outline btn-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

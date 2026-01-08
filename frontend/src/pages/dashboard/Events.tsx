import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { eventService } from '../../services/otherServices'
import type { Event, PaginatedResponse } from '../../types'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function Events() {
  const [events, setEvents] = useState<Event[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')

  const eventTypes = eventService.getEventTypes()

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      const response: PaginatedResponse<Event> = await eventService.getAll({
        event_type: typeFilter,
        page,
        limit: 10,
      })
      setEvents(response.data || response.events || [])
      setPagination({
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
        pages: response.pages || 1,
      })
    } catch (error) {
      console.error('Failed to fetch events:', error)
      toast.error('Failed to load events')
    } finally {
      setIsLoading(false)
    }
  }, [page, typeFilter])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      await eventService.delete(id)
      toast.success('Event deleted successfully')
      fetchEvents()
    } catch {
      toast.error('Failed to delete event')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <span className="badge badge-blue">Upcoming</span>
      case 'ongoing':
        return <span className="badge badge-green">Ongoing</span>
      case 'completed':
        return <span className="badge badge-gray">Completed</span>
      case 'cancelled':
        return <span className="badge badge-red">Cancelled</span>
      default:
        return <span className="badge badge-gray">{status}</span>
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-PH', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-PH', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">Manage barangay events and activities</p>
        </div>
        <Link to="/events/new" className="btn btn-primary inline-flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          New Event
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex gap-4">
          <select
            className="input w-auto"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Types</option>
            {eventTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="card text-center py-12">
          <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500 mb-4">Create your first event</p>
          <Link to="/events/new" className="btn btn-primary inline-flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            New Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                {getStatusBadge(event.status)}
                <div className="flex items-center gap-1">
                  <Link
                    to={`/events/${event.id}`}
                    className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/events/${event.id}/edit`}
                    className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-2 mb-4">{event.description}</p>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(event.event_date)}</span>
                </div>
                {event.start_time && (
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                    <span>
                      {formatTime(event.start_time)}
                      {event.end_time && ` - ${formatTime(event.end_time)}`}
                    </span>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="badge badge-gray capitalize">
                  {eventTypes.find((t) => t.value === event.event_type)?.label ||
                    event.event_type?.replace(/_/g, ' ')}
                </span>
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

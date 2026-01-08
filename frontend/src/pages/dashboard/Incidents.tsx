import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { incidentService, IncidentFilters } from '../../services/incidentService'
import type { Incident, PaginatedResponse } from '../../types'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<IncidentFilters>({
    search: '',
    incident_type: undefined,
    status: undefined,
    page: 1,
    limit: 10,
  })

  const incidentTypes = incidentService.getIncidentTypes()
  const statusOptions = incidentService.getStatusOptions()

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true)
    try {
      const response: PaginatedResponse<Incident> = await incidentService.getAll(filters)
      setIncidents(response.data || response.incidents || [])
      setPagination({
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
        pages: response.pages || 1,
      })
    } catch (error) {
      console.error('Failed to fetch incidents:', error)
      toast.error('Failed to load incidents')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchIncidents()
  }, [fetchIncidents])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ ...filters, page: 1 })
  }

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find((o) => o.value === status)
    const colorMap: Record<string, string> = {
      gray: 'badge-gray',
      yellow: 'badge-yellow',
      blue: 'badge-blue',
      purple: 'badge-purple',
      green: 'badge-green',
      red: 'badge-red',
    }
    return (
      <span className={`badge ${colorMap[option?.color || 'gray']}`}>
        {option?.label || status}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="badge badge-red">High</span>
      case 'medium':
        return <span className="badge badge-yellow">Medium</span>
      case 'low':
        return <span className="badge badge-green">Low</span>
      default:
        return <span className="badge badge-gray">{priority}</span>
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-gray-500 mt-1">Manage barangay incident reports</p>
        </div>
        <Link to="/incidents/new" className="btn btn-primary inline-flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Report Incident
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search incidents..."
              className="input pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-secondary' : 'btn-outline'} inline-flex items-center gap-2`}
          >
            <FunnelIcon className="w-5 h-5" />
            Filters
          </button>
        </form>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="input"
                value={filters.incident_type || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    incident_type: e.target.value as IncidentFilters['incident_type'],
                    page: 1,
                  })
                }
              >
                <option value="">All Types</option>
                {incidentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="input"
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value as IncidentFilters['status'],
                    page: 1,
                  })
                }
              >
                <option value="">All Status</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="input"
                value={filters.priority || ''}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Case #</th>
                <th>Type</th>
                <th>Reported By</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <ExclamationTriangleIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No incidents found</p>
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td className="font-mono text-sm">{incident.case_number}</td>
                    <td>
                      <span className="capitalize">
                        {incidentTypes.find((t) => t.value === incident.incident_type)?.label ||
                          incident.incident_type?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{incident.complainant_name}</td>
                    <td>{formatDate(incident.incident_date)}</td>
                    <td>{getPriorityBadge(incident.priority)}</td>
                    <td>{getStatusBadge(incident.status)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/incidents/${incident.id}`}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </Link>
                        <Link
                          to={`/incidents/${incident.id}/edit`}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
                disabled={pagination.page === 1}
                className="btn btn-outline btn-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
                disabled={pagination.page >= pagination.pages}
                className="btn btn-outline btn-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

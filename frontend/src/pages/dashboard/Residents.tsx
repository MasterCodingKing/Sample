import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { residentService, ResidentFilters } from '../../services/residentService'
import type { Resident, PaginatedResponse } from '../../types'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function Residents() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ResidentFilters>({
    search: '',
    gender: '',
    civil_status: '',
    voter_status: '',
    page: 1,
    limit: 10,
  })

  const fetchResidents = useCallback(async () => {
    setIsLoading(true)
    try {
      const response: PaginatedResponse<Resident> = await residentService.getAll(filters)
      setResidents(response.data || response.residents || [])
      setPagination({
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
        pages: response.pages || 1,
      })
    } catch (error) {
      console.error('Failed to fetch residents:', error)
      toast.error('Failed to load residents')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchResidents()
  }, [fetchResidents])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ ...filters, page: 1 })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resident?')) return

    try {
      await residentService.delete(id)
      toast.success('Resident deleted successfully')
      fetchResidents()
    } catch {
      toast.error('Failed to delete resident')
    }
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      gender: '',
      civil_status: '',
      voter_status: '',
      page: 1,
      limit: 10,
    })
  }

  const getAge = (birthdate: string) => {
    const today = new Date()
    const birth = new Date(birthdate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Residents</h1>
          <p className="text-gray-500 mt-1">Manage barangay residents</p>
        </div>
        <Link to="/residents/new" className="btn btn-primary inline-flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Add Resident
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, contact, or address..."
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

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  className="input"
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value, page: 1 })}
                >
                  <option value="">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                <select
                  className="input"
                  value={filters.civil_status}
                  onChange={(e) => setFilters({ ...filters, civil_status: e.target.value, page: 1 })}
                >
                  <option value="">All</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="widowed">Widowed</option>
                  <option value="separated">Separated</option>
                  <option value="divorced">Divorced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voter Status</label>
                <select
                  className="input"
                  value={filters.voter_status}
                  onChange={(e) => setFilters({ ...filters, voter_status: e.target.value, page: 1 })}
                >
                  <option value="">All</option>
                  <option value="registered">Registered</option>
                  <option value="not_registered">Not Registered</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
              >
                <XMarkIcon className="w-4 h-4" />
                Clear filters
              </button>
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
                <th>Name</th>
                <th>Age/Gender</th>
                <th>Address</th>
                <th>Contact</th>
                <th>Civil Status</th>
                <th>Voter</th>
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
              ) : residents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No residents found
                  </td>
                </tr>
              ) : (
                residents.map((resident) => (
                  <tr key={resident.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-medium text-sm">
                            {resident.first_name?.[0]}
                            {resident.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {resident.first_name} {resident.middle_name?.[0] ? `${resident.middle_name[0]}.` : ''} {resident.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{resident.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-gray-900">{getAge(resident.birthdate)} yrs</p>
                      <p className="text-sm text-gray-500 capitalize">{resident.gender}</p>
                    </td>
                    <td>
                      <p className="text-gray-900 max-w-[200px] truncate" title={resident.address}>
                        {resident.address}
                      </p>
                      {resident.purok && <p className="text-sm text-gray-500">Purok {resident.purok}</p>}
                    </td>
                    <td className="text-gray-900">{resident.contact_number || '-'}</td>
                    <td>
                      <span className="badge badge-gray capitalize">{resident.civil_status}</span>
                    </td>
                    <td>
                      {resident.is_voter ? (
                        <span className="badge badge-green">Registered</span>
                      ) : (
                        <span className="badge badge-gray">Not Registered</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/residents/${resident.id}`}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                          title="View"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </Link>
                        <Link
                          to={`/residents/${resident.id}/edit`}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(resident.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
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
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="btn btn-outline btn-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
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

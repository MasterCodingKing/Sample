import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { businessService } from '../../services/businessService'
import type { Business, PaginatedResponse } from '../../types'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function Businesses() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true)
    try {
      const response: PaginatedResponse<Business> = await businessService.getAll({
        search,
        status: statusFilter,
        page,
        limit: 10,
      })
      setBusinesses(response.data || response.businesses || [])
      setPagination({
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
        pages: response.pages || 1,
      })
    } catch (error) {
      console.error('Failed to fetch businesses:', error)
      toast.error('Failed to load businesses')
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => {
    fetchBusinesses()
  }, [fetchBusinesses])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this business?')) return

    try {
      await businessService.delete(id)
      toast.success('Business deleted successfully')
      fetchBusinesses()
    } catch {
      toast.error('Failed to delete business')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-green">Active</span>
      case 'inactive':
        return <span className="badge badge-gray">Inactive</span>
      case 'closed':
        return <span className="badge badge-red">Closed</span>
      default:
        return <span className="badge badge-gray">{status}</span>
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
          <p className="text-gray-500 mt-1">Manage registered businesses</p>
        </div>
        <Link to="/businesses/new" className="btn btn-primary inline-flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Add Business
        </Link>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by business name or owner..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input w-auto"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="closed">Closed</option>
          </select>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Owner</th>
                <th>Type</th>
                <th>Address</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <BuildingStorefrontIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No businesses found</p>
                  </td>
                </tr>
              ) : (
                businesses.map((business) => (
                  <tr key={business.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <BuildingStorefrontIcon className="w-5 h-5 text-primary-600" />
                        </div>
                        <p className="font-medium text-gray-900">{business.business_name}</p>
                      </div>
                    </td>
                    <td>{business.owner_name}</td>
                    <td className="capitalize">{business.business_type?.replace(/_/g, ' ')}</td>
                    <td className="max-w-[200px] truncate">{business.business_address}</td>
                    <td>{getStatusBadge(business.status)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/businesses/${business.id}`}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </Link>
                        <Link
                          to={`/businesses/${business.id}/edit`}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(business.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn btn-outline btn-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.pages}
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

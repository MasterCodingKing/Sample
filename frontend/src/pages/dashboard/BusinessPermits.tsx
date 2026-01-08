import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { businessService } from '../../services/businessService'
import type { BusinessPermit, PaginatedResponse } from '../../types'
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function BusinessPermits() {
  const [permits, setPermits] = useState<BusinessPermit[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const fetchPermits = useCallback(async () => {
    setIsLoading(true)
    try {
      const response: PaginatedResponse<BusinessPermit> = await businessService.getPermits({
        status: statusFilter,
        page,
        limit: 10,
      })
      setPermits(response.data || response.permits || [])
      setPagination({
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
        pages: response.pages || 1,
      })
    } catch (error) {
      console.error('Failed to fetch permits:', error)
      toast.error('Failed to load business permits')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    fetchPermits()
  }, [fetchPermits])

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await businessService.updatePermitStatus(id, status)
      toast.success(`Permit ${status} successfully`)
      fetchPermits()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-yellow">Pending</span>
      case 'approved':
        return <span className="badge badge-green">Approved</span>
      case 'rejected':
        return <span className="badge badge-red">Rejected</span>
      case 'expired':
        return <span className="badge badge-gray">Expired</span>
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

  const filteredPermits = permits.filter((p) =>
    p.business?.business_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Permits</h1>
          <p className="text-gray-500 mt-1">Manage business permit applications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by business name..."
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Permit No.</th>
                <th>Business</th>
                <th>Owner</th>
                <th>Year</th>
                <th>Valid Until</th>
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
              ) : filteredPermits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No permits found</p>
                  </td>
                </tr>
              ) : (
                filteredPermits.map((permit) => (
                  <tr key={permit.id}>
                    <td className="font-mono text-sm">{permit.permit_number}</td>
                    <td className="font-medium">{permit.business?.business_name}</td>
                    <td>{permit.business?.owner_name}</td>
                    <td>{permit.year}</td>
                    <td>{permit.valid_until ? formatDate(permit.valid_until) : '-'}</td>
                    <td>{getStatusBadge(permit.status)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/business-permits/${permit.id}`}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </Link>
                        {permit.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(permit.id, 'approved')}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              <CheckCircleIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(permit.id, 'rejected')}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {permit.status === 'approved' && (
                          <button
                            onClick={() => handleStatusUpdate(permit.id, 'released')}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Mark as Released"
                          >
                            <ClockIcon className="w-5 h-5" />
                          </button>
                        )}
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

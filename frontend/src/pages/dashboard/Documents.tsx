import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { documentService, DocumentFilters } from '../../services/documentService'
import type { Document, PaginatedResponse } from '../../types'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<DocumentFilters>({
    search: '',
    document_type: '',
    status: '',
    page: 1,
    limit: 10,
  })

  const documentTypes = documentService.getDocumentTypes()

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)
    try {
      const response: PaginatedResponse<Document> = await documentService.getAll(filters)
      setDocuments(response.data || response.documents || [])
      setPagination({
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
        pages: response.pages || 1,
      })
    } catch (error) {
      console.error('Failed to fetch documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ ...filters, page: 1 })
  }

  const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected' | 'released') => {
    try {
      await documentService.updateStatus(id, status)
      toast.success(`Document ${status} successfully`)
      fetchDocuments()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDownload = async (id: number, controlNumber: string) => {
    try {
      const blob = await documentService.downloadPdf(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${controlNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      toast.error('Failed to download document')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-yellow">Pending</span>
      case 'approved':
        return <span className="badge badge-blue">Approved</span>
      case 'released':
        return <span className="badge badge-green">Released</span>
      case 'rejected':
        return <span className="badge badge-red">Rejected</span>
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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 mt-1">Manage barangay document requests</p>
        </div>
        <Link to="/documents/new" className="btn btn-primary inline-flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Issue Document
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by control number or resident name..."
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
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
              <select
                className="input"
                value={filters.document_type}
                onChange={(e) => setFilters({ ...filters, document_type: e.target.value, page: 1 })}
              >
                <option value="">All Types</option>
                {documentTypes.map((type) => (
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
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="released">Released</option>
                <option value="rejected">Rejected</option>
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
                <th>Control Number</th>
                <th>Type</th>
                <th>Resident</th>
                <th>Purpose</th>
                <th>Date Requested</th>
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
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No documents found
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="font-mono text-sm">{doc.control_number}</td>
                    <td>
                      <span className="capitalize">{doc.document_type.replace(/_/g, ' ')}</span>
                    </td>
                    <td>
                      <p className="font-medium text-gray-900">
                        {doc.resident?.first_name} {doc.resident?.last_name}
                      </p>
                    </td>
                    <td className="max-w-[200px] truncate" title={doc.purpose}>
                      {doc.purpose}
                    </td>
                    <td>{formatDate(doc.created_at)}</td>
                    <td>{getStatusBadge(doc.status)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                          title="View"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </Link>
                        {doc.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(doc.id, 'approved')}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              <CheckCircleIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(doc.id, 'rejected')}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {doc.status === 'approved' && (
                          <button
                            onClick={() => handleStatusUpdate(doc.id, 'released')}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Mark as Released"
                          >
                            <ClockIcon className="w-5 h-5" />
                          </button>
                        )}
                        {(doc.status === 'approved' || doc.status === 'released') && (
                          <button
                            onClick={() => handleDownload(doc.id, doc.control_number)}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                            title="Download PDF"
                          >
                            <DocumentArrowDownIcon className="w-5 h-5" />
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

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { householdService } from '../../services/householdService'
import type { Household, PaginatedResponse } from '../../types'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  HomeModernIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function Households() {
  const [households, setHouseholds] = useState<Household[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchHouseholds = useCallback(async () => {
    setIsLoading(true)
    try {
      const response: PaginatedResponse<Household> = await householdService.getAll({
        search,
        page,
        limit: 10,
      })
      setHouseholds(response.data || response.households || [])
      setPagination({
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
        pages: response.pages || 1,
      })
    } catch (error) {
      console.error('Failed to fetch households:', error)
      toast.error('Failed to load households')
    } finally {
      setIsLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    fetchHouseholds()
  }, [fetchHouseholds])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this household?')) return

    try {
      await householdService.delete(id)
      toast.success('Household deleted successfully')
      fetchHouseholds()
    } catch {
      toast.error('Failed to delete household')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Households</h1>
          <p className="text-gray-500 mt-1">Manage barangay households</p>
        </div>
        <Link to="/households/new" className="btn btn-primary inline-flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Add Household
        </Link>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by head name or address..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
        </div>
      ) : households.length === 0 ? (
        <div className="card text-center py-12">
          <HomeModernIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No households found</h3>
          <p className="text-gray-500 mb-4">Get started by adding a new household</p>
          <Link to="/households/new" className="btn btn-primary inline-flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Add Household
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {households.map((household) => (
            <div key={household.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <HomeModernIcon className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    to={`/households/${household.id}`}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </Link>
                  <Link
                    to={`/households/${household.id}/edit`}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(household.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-1">
                {household.household_head_name || 'No Head Assigned'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{household.address}</p>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UsersIcon className="w-4 h-4" />
                  <span>{household.member_count || 0} members</span>
                </div>
                {household.purok && (
                  <span className="text-sm text-gray-500">Purok {household.purok}</span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {household.house_ownership && (
                  <span className="badge badge-gray capitalize">{household.house_ownership}</span>
                )}
                {household.housing_type && (
                  <span className="badge badge-blue capitalize">{household.housing_type.replace('_', ' ')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6 card">
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </p>
          <div className="flex items-center gap-2">
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
        </div>
      )}
    </div>
  )
}

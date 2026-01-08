import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { userService } from '../../services/otherServices'
import type { User, PaginatedResponse } from '../../types'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

export default function Users() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)

  const roles = userService.getRoles()

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response: PaginatedResponse<User> = await userService.getAll({
        role: roleFilter,
        page,
        limit: 10,
      })
      setUsers(response.data || response.users || [])
      setPagination({
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
        pages: response.pages || 1,
      })
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [roleFilter, page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = async (id: number) => {
    if (id === currentUser?.id) {
      toast.error('You cannot delete your own account')
      return
    }
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      await userService.delete(id)
      toast.success('User deleted successfully')
      fetchUsers()
    } catch {
      toast.error('Failed to delete user')
    }
  }

  const handleToggleStatus = async (id: number) => {
    if (id === currentUser?.id) {
      toast.error('You cannot deactivate your own account')
      return
    }

    try {
      await userService.toggleStatus(id)
      toast.success('User status updated')
      fetchUsers()
    } catch {
      toast.error('Failed to update user status')
    }
  }

  const getRoleBadge = (role: string) => {
    const colorMap: Record<string, string> = {
      super_admin: 'badge-purple',
      admin: 'badge-blue',
      captain: 'badge-green',
      secretary: 'badge-yellow',
      treasurer: 'badge-yellow',
      staff: 'badge-gray',
      resident: 'badge-gray',
    }
    return (
      <span className={`badge ${colorMap[role] || 'badge-gray'} capitalize`}>
        {role.replace('_', ' ')}
      </span>
    )
  }

  const filteredUsers = users.filter(
    (u) =>
      u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">Manage system users and permissions</p>
        </div>
        <Link to="/users/new" className="btn btn-primary inline-flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Add User
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input w-auto"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Barangay</th>
                <th>Status</th>
                <th>Last Login</th>
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-medium text-sm">
                            {user.first_name?.[0]}
                            {user.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>{user.barangay?.name || '-'}</td>
                    <td>
                      {user.is_active ? (
                        <span className="badge badge-green">Active</span>
                      ) : (
                        <span className="badge badge-red">Inactive</span>
                      )}
                    </td>
                    <td className="text-sm text-gray-500">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`p-2 rounded-lg ${
                            user.is_active
                              ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={user.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {user.is_active ? (
                            <ShieldExclamationIcon className="w-5 h-5" />
                          ) : (
                            <ShieldCheckIcon className="w-5 h-5" />
                          )}
                        </button>
                        <Link
                          to={`/users/${user.id}/edit`}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(user.id)}
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

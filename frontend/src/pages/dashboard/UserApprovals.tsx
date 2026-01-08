import { useState, useEffect } from 'react'
import { userService } from '../../services/dashboardService'
import toast from 'react-hot-toast'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

interface PendingUser {
  id: number
  email: string
  first_name: string
  last_name: string
  phone?: string
  barangay?: {
    id: number
    name: string
  }
  approval_status: string
  created_at: string
}

export default function UserApprovals() {
  const [users, setUsers] = useState<PendingUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchPendingUsers = async () => {
    try {
      setIsLoading(true)
      const response = await userService.getPendingApprovals()
      setUsers(response.users)
    } catch (error) {
      console.error('Failed to fetch pending users:', error)
      toast.error('Failed to load pending users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  const handleApprove = async (userId: number) => {
    try {
      setActionLoading(userId)
      await userService.approveUser(userId)
      toast.success('User approved successfully')
      setUsers(users.filter(u => u.id !== userId))
    } catch (error) {
      console.error('Failed to approve user:', error)
      toast.error('Failed to approve user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (userId: number) => {
    if (!confirm('Are you sure you want to reject this user registration?')) {
      return
    }

    try {
      setActionLoading(userId)
      await userService.rejectUser(userId)
      toast.success('User registration rejected')
      setUsers(users.filter(u => u.id !== userId))
    } catch (error) {
      console.error('Failed to reject user:', error)
      toast.error('Failed to reject user')
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Approvals</h1>
        <p className="text-gray-600 mt-1">Review and approve resident registrations</p>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending approvals</h3>
          <p className="text-gray-600">All user registrations have been reviewed.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barangay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.barangay?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleApprove(user.id)}
                        disabled={actionLoading === user.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(user.id)}
                        disabled={actionLoading === user.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <XCircleIcon className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

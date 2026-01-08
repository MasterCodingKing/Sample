import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { userService } from '../../services/otherServices'
import { residentService } from '../../services/residentService'
import type { User, Resident } from '../../types'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

type UserFormData = Omit<User, 'id' | 'created_at' | 'updated_at' | 'barangay' | 'last_login' | 'email_verified'> & {
  password?: string
  confirm_password?: string
}

export default function UserForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const isEdit = Boolean(id)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(isEdit)
  const [residents, setResidents] = useState<Resident[]>([])
  const [showPassword, setShowPassword] = useState(false)

  const roles = userService.getRoles()
  const isSuperAdmin = currentUser?.role === 'super_admin'

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    defaultValues: {
      status: 'active',
      role: 'staff',
    },
  })

  const password = watch('password')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch residents for linking
        const residentResponse = await residentService.getAll({ limit: 1000 })
        setResidents(residentResponse.data || residentResponse.residents || [])

        if (id) {
          const user = await userService.getById(Number(id))
          reset({
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            middle_name: user.middle_name || '',
            role: user.role,
            phone: user.phone || '',
            barangay_id: user.barangay_id,
            status: user.status,
          })
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load data')
      } finally {
        setIsFetching(false)
      }
    }
    fetchData()
  }, [id, reset])

  const onSubmit = async (data: UserFormData) => {
    // Password validation for new users
    if (!isEdit && !data.password) {
      toast.error('Password is required for new users')
      return
    }

    if (data.password && data.password !== data.confirm_password) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const submitData = { ...data }
      delete submitData.confirm_password

      if (isEdit) {
        // Don't send password if empty
        if (!submitData.password) {
          delete submitData.password
        }
        await userService.update(Number(id), submitData)
        toast.success('User updated successfully')
      } else {
        await userService.create(submitData as UserFormData & { password: string })
        toast.success('User created successfully')
      }
      navigate('/users')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to save user')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/users"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit User' : 'Create New User'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isEdit ? 'Update user information' : 'Add a new system user'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Account Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="user@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                className="input"
                placeholder="09xxxxxxxxx"
                {...register('phone')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {isEdit ? '(leave empty to keep current)' : '*'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder={isEdit ? '••••••••' : 'Enter password'}
                  {...register('password', {
                    required: isEdit ? false : 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`input ${errors.confirm_password ? 'border-red-500' : ''}`}
                placeholder="Confirm password"
                {...register('confirm_password', {
                  validate: (value) =>
                    !password || value === password || 'Passwords do not match',
                })}
              />
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-500">{errors.confirm_password.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                className={`input ${errors.first_name ? 'border-red-500' : ''}`}
                {...register('first_name', { required: 'First name is required' })}
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-500">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
              <input type="text" className="input" {...register('middle_name')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                className={`input ${errors.last_name ? 'border-red-500' : ''}`}
                {...register('last_name', { required: 'Last name is required' })}
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-500">{errors.last_name.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Role & Access */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Role & Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                className={`input ${errors.role ? 'border-red-500' : ''}`}
                {...register('role', { required: 'Role is required' })}
              >
                {roles
                  .filter((role) => isSuperAdmin || role.value !== 'super_admin')
                  .map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input" {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Link to Resident */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Link to Resident (Optional)</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Associated Resident
            </label>
            <select className="input" {...register('resident_id', { valueAsNumber: true })}>
              <option value="">-- Not linked to a resident --</option>
              {residents.map((resident) => (
                <option key={resident.id} value={resident.id}>
                  {resident.last_name}, {resident.first_name} {resident.middle_name || ''} -{' '}
                  {resident.address}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Link this user account to an existing resident profile
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link to="/users" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </>
            ) : isEdit ? (
              'Update User'
            ) : (
              'Create User'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

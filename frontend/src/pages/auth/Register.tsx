import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../../store/authStore'
import { barangayService } from '../../services/dashboardService'
import type { Barangay } from '../../types'
import toast from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

interface RegisterForm {
  first_name: string
  last_name: string
  email: string
  password: string
  confirm_password: string
  barangay_id: number
}

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [barangays, setBarangays] = useState<Barangay[]>([])
  const { register: registerUser } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>()

  const password = watch('password')

  useEffect(() => {
    const fetchBarangays = async () => {
      try {
        const data = await barangayService.getAll()
        setBarangays(data)
      } catch {
        console.error('Failed to fetch barangays')
      }
    }
    fetchBarangays()
  }, [])

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        barangay_id: data.barangay_id,
      })
      toast.success('Registration submitted! Please wait for barangay admin approval.')
      navigate('/login', { state: { message: 'Your registration is pending approval from the barangay administrator.' } })
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Create an account</h2>
      <p className="text-gray-500 text-center mb-8">Register to access the system</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1.5">
              First Name
            </label>
            <input
              id="first_name"
              type="text"
              className={`input ${errors.first_name ? 'border-red-500' : ''}`}
              placeholder="Juan"
              {...register('first_name', { required: 'First name is required' })}
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Last Name
            </label>
            <input
              id="last_name"
              type="text"
              className={`input ${errors.last_name ? 'border-red-500' : ''}`}
              placeholder="Dela Cruz"
              {...register('last_name', { required: 'Last name is required' })}
            />
            {errors.last_name && (
              <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className={`input ${errors.email ? 'border-red-500' : ''}`}
            placeholder="juan@example.com"
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
          <label htmlFor="barangay_id" className="block text-sm font-medium text-gray-700 mb-1.5">
            Barangay
          </label>
          <select
            id="barangay_id"
            className={`input ${errors.barangay_id ? 'border-red-500' : ''}`}
            {...register('barangay_id', { required: 'Barangay is required' })}
          >
            <option value="">Select your barangay</option>
            {barangays.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          {errors.barangay_id && (
            <p className="mt-1 text-sm text-red-500">{errors.barangay_id.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={`input pr-10 ${errors.password ? 'border-red-500' : ''}`}
              placeholder="Create a password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Password must contain uppercase, lowercase, and number',
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
          <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirm Password
          </label>
          <input
            id="confirm_password"
            type="password"
            className={`input ${errors.confirm_password ? 'border-red-500' : ''}`}
            placeholder="Confirm your password"
            {...register('confirm_password', {
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords do not match',
            })}
          />
          {errors.confirm_password && (
            <p className="mt-1 text-sm text-red-500">{errors.confirm_password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full mt-6"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creating account...
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
          Sign in
        </Link>
      </p>
    </div>
  )
}

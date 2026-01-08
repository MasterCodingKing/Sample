import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface ResetPasswordForm {
  password: string
  confirm_password: string
}

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>()

  const password = watch('password')

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error('Invalid reset token')
      return
    }

    setIsLoading(true)
    try {
      await authService.resetPassword(token, data.password)
      setIsSuccess(true)
      toast.success('Password reset successful!')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
        <p className="text-gray-500 mb-6">
          The password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link to="/forgot-password" className="btn btn-primary">
          Request New Link
        </Link>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
        <p className="text-gray-500 mb-6">
          Your password has been successfully reset. You can now log in with your new password.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="btn btn-primary w-full"
        >
          Go to Login
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Reset Password</h2>
      <p className="text-gray-500 text-center mb-8">
        Enter your new password below
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={`input pr-10 ${errors.password ? 'border-red-500' : ''}`}
              placeholder="Enter new password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Must contain uppercase, lowercase, and number',
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
            Confirm New Password
          </label>
          <input
            id="confirm_password"
            type="password"
            className={`input ${errors.confirm_password ? 'border-red-500' : ''}`}
            placeholder="Confirm new password"
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
          className="btn btn-primary w-full"
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
              Resetting...
            </span>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
    </div>
  )
}

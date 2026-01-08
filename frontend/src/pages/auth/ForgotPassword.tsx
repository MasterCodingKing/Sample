import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

interface ForgotPasswordForm {
  email: string
}

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>()

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    try {
      await authService.forgotPassword(data.email)
      setIsSubmitted(true)
      toast.success('Password reset instructions sent!')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <EnvelopeIcon className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-500 mb-6">
          We've sent password reset instructions to your email address. Please check your inbox.
        </p>
        <Link to="/login" className="btn btn-primary w-full">
          Back to Login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to login
      </Link>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot password?</h2>
      <p className="text-gray-500 mb-8">
        No worries, we'll send you reset instructions.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`input ${errors.email ? 'border-red-500' : ''}`}
            placeholder="Enter your email"
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
              Sending...
            </span>
          ) : (
            'Send Reset Instructions'
          )}
        </button>
      </form>
    </div>
  )
}

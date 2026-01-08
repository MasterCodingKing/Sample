import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'
import {
  UserCircleIcon,
  KeyIcon,
  BellIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'

interface ProfileForm {
  first_name: string
  last_name: string
  email: string
  contact_number: string
}

interface PasswordForm {
  current_password: string
  new_password: string
  confirm_password: string
}

export default function Profile() {
  const { user, updateUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications'>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      contact_number: user?.contact_number || '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>()

  const newPassword = watch('new_password')

  const onProfileSubmit = async (data: ProfileForm) => {
    setIsLoading(true)
    try {
      await authService.updateProfile(data)
      updateUser(data)
      toast.success('Profile updated successfully')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsLoading(true)
    try {
      await authService.changePassword(data.current_password, data.new_password)
      toast.success('Password changed successfully')
      resetPassword()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { key: 'profile', label: 'Profile', icon: UserCircleIcon },
    { key: 'password', label: 'Password', icon: KeyIcon },
    { key: 'notifications', label: 'Notifications', icon: BellIcon },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* User Card */}
          <div className="card mt-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary-100 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-700">
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">
              {user?.first_name} {user?.last_name}
            </h3>
            <p className="text-sm text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            <p className="text-sm text-gray-500 mt-1">{user?.barangay?.name}</p>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      className={`input ${profileErrors.first_name ? 'border-red-500' : ''}`}
                      {...registerProfile('first_name', { required: 'First name is required' })}
                    />
                    {profileErrors.first_name && (
                      <p className="mt-1 text-sm text-red-500">{profileErrors.first_name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className={`input ${profileErrors.last_name ? 'border-red-500' : ''}`}
                      {...registerProfile('last_name', { required: 'Last name is required' })}
                    />
                    {profileErrors.last_name && (
                      <p className="mt-1 text-sm text-red-500">{profileErrors.last_name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className={`input ${profileErrors.email ? 'border-red-500' : ''}`}
                      {...registerProfile('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                    />
                    {profileErrors.email && (
                      <p className="mt-1 text-sm text-red-500">{profileErrors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="09xxxxxxxxx"
                      {...registerProfile('contact_number')}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button type="submit" disabled={isLoading} className="btn btn-primary">
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      className={`input pr-10 ${passwordErrors.current_password ? 'border-red-500' : ''}`}
                      {...registerPassword('current_password', {
                        required: 'Current password is required',
                      })}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                      }
                    >
                      {showPasswords.current ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.current_password && (
                    <p className="mt-1 text-sm text-red-500">
                      {passwordErrors.current_password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      className={`input pr-10 ${passwordErrors.new_password ? 'border-red-500' : ''}`}
                      {...registerPassword('new_password', {
                        required: 'New password is required',
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    >
                      {showPasswords.new ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.new_password && (
                    <p className="mt-1 text-sm text-red-500">{passwordErrors.new_password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      className={`input pr-10 ${passwordErrors.confirm_password ? 'border-red-500' : ''}`}
                      {...registerPassword('confirm_password', {
                        required: 'Please confirm your password',
                        validate: (value) => value === newPassword || 'Passwords do not match',
                      })}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                      }
                    >
                      {showPasswords.confirm ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirm_password && (
                    <p className="mt-1 text-sm text-red-500">
                      {passwordErrors.confirm_password.message}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button type="submit" disabled={isLoading} className="btn btn-primary">
                    {isLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive email updates about your account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Document Updates</p>
                    <p className="text-sm text-gray-500">Get notified when document status changes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Announcements</p>
                    <p className="text-sm text-gray-500">Receive barangay announcements</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Event Reminders</p>
                    <p className="text-sm text-gray-500">Get reminded about upcoming events</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

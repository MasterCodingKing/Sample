import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  HomeIcon,
  UsersIcon,
  HomeModernIcon,
  DocumentTextIcon,
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ChevronDownIcon,
  BellIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Residents', href: '/residents', icon: UsersIcon },
  { name: 'Households', href: '/households', icon: HomeModernIcon },
  { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
  { name: 'Businesses', href: '/businesses', icon: BuildingStorefrontIcon },
  { name: 'Incidents', href: '/incidents', icon: ExclamationTriangleIcon },
  { name: 'Announcements', href: '/announcements', icon: MegaphoneIcon },
  { name: 'Events', href: '/events', icon: CalendarDaysIcon },
  { name: 'Officials', href: '/officials', icon: UserGroupIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
]

const adminNavigation = [
  { name: 'Users', href: '/users', icon: UsersIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

// Super Admin only navigation
const superAdminNavigation = [
  { name: 'Barangays', href: '/barangays', icon: BuildingOffice2Icon },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const isSuperAdmin = user?.role === 'super_admin'
  const isAdmin = isSuperAdmin || user?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">Barangay System</h1>
              <p className="text-xs text-gray-500">{user?.barangay?.name || 'Malvar'}</p>
            </div>
          </div>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </div>

          {isAdmin && (
            <>
              <div className="my-4 px-3">
                <div className="border-t border-gray-200"></div>
              </div>
              <div className="px-3 mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Administration
                </p>
              </div>
              <div className="space-y-1">
                {adminNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </NavLink>
                ))}
                {/* Super Admin Only - Barangays */}
                {isSuperAdmin && superAdminNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-medium">
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:flex-none"></div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100">
                <BellIcon className="w-6 h-6 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 text-sm font-medium">
                      {user?.first_name?.[0]}
                      {user?.last_name?.[0]}
                    </span>
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                      <div className="p-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <NavLink
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <UserCircleIcon className="w-5 h-5" />
                          Profile
                        </NavLink>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <ArrowRightOnRectangleIcon className="w-5 h-5" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

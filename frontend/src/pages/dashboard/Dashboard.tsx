import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardService } from '../../services/dashboardService'
import { useAuthStore } from '../../store/authStore'
import type { DashboardStats } from '../../types'
import {
  UsersIcon,
  HomeModernIcon,
  DocumentTextIcon,
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function Dashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    {
      name: 'Total Residents',
      value: stats?.totalResidents || 0,
      icon: UsersIcon,
      change: '+12%',
      changeType: 'increase' as const,
      href: '/residents',
      color: 'bg-blue-500',
    },
    {
      name: 'Households',
      value: stats?.totalHouseholds || 0,
      icon: HomeModernIcon,
      change: '+5%',
      changeType: 'increase' as const,
      href: '/households',
      color: 'bg-green-500',
    },
    {
      name: 'Documents Issued',
      value: stats?.totalDocuments || 0,
      icon: DocumentTextIcon,
      change: '+23%',
      changeType: 'increase' as const,
      href: '/documents',
      color: 'bg-purple-500',
    },
    {
      name: 'Active Businesses',
      value: stats?.totalBusinesses || 0,
      icon: BuildingStorefrontIcon,
      change: '+8%',
      changeType: 'increase' as const,
      href: '/businesses',
      color: 'bg-yellow-500',
    },
    {
      name: 'Open Incidents',
      value: stats?.pendingIncidents || 0,
      icon: ExclamationTriangleIcon,
      change: '-15%',
      changeType: 'decrease' as const,
      href: '/incidents',
      color: 'bg-red-500',
    },
    {
      name: 'Upcoming Events',
      value: stats?.upcomingEvents || 0,
      icon: CalendarDaysIcon,
      change: '+2',
      changeType: 'increase' as const,
      href: '/events',
      color: 'bg-indigo-500',
    },
  ]

  const documentTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Documents Issued',
        data: [65, 78, 90, 85, 95, 110],
        fill: true,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const populationData = {
    labels: ['Male', 'Female'],
    datasets: [
      {
        data: [stats?.maleCount || 48, stats?.femaleCount || 52],
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(236, 72, 153, 0.8)'],
        borderWidth: 0,
      },
    ],
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here's what's happening in {user?.barangay?.name || 'your barangay'} today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="card hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4">
              {stat.changeType === 'increase' ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.change}
              </span>
              <span className="text-sm text-gray-500">from last month</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Document Trend */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Issuance Trend</h3>
          <div className="h-[300px]">
            <Line
              data={documentTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Population Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Population by Gender</h3>
          <div className="h-[300px] flex items-center justify-center">
            <Doughnut
              data={populationData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
                cutout: '60%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Documents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Documents</h3>
            <Link to="/documents?status=pending" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.pendingDocuments && stats.pendingDocuments > 0 ? (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <DocumentTextIcon className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {stats.pendingDocuments} document{stats.pendingDocuments > 1 ? 's' : ''} awaiting approval
                  </p>
                  <p className="text-xs text-gray-500">Requires your attention</p>
                </div>
                <Link to="/documents?status=pending" className="btn btn-secondary btn-sm">
                  Review
                </Link>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No pending documents</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/residents/new"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <UsersIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Add Resident</p>
            </Link>
            <Link
              to="/documents/new"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <DocumentTextIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Issue Document</p>
            </Link>
            <Link
              to="/incidents/new"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <ExclamationTriangleIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Report Incident</p>
            </Link>
            <Link
              to="/announcements/new"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <CalendarDaysIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Post Announcement</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

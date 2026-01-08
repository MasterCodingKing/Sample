import { useState, useEffect } from 'react'
import { dashboardService } from '../../services/dashboardService'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'population' | 'documents' | 'financial'>('population')
  const [populationData, setPopulationData] = useState<{
    total: number
    byGender: { male: number; female: number }
    byAgeGroup: Record<string, number>
    byCivilStatus: Record<string, number>
    voters: number
    pwd: number
    seniorCitizens: number
  } | null>(null)
  const [documentData, setDocumentData] = useState<{
    total: number
    byType: Record<string, number>
    byStatus: Record<string, number>
    revenue: number
  } | null>(null)
  const [financialData, setFinancialData] = useState<{
    documentFees: number
    permitFees: number
    total: number
    byMonth: { month: string; amount: number }[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        if (activeTab === 'population') {
          const data = await dashboardService.getPopulationReport()
          setPopulationData(data)
        } else if (activeTab === 'documents') {
          const data = await dashboardService.getDocumentReport(dateRange.from ? dateRange : undefined)
          setDocumentData(data)
        } else if (activeTab === 'financial') {
          const data = await dashboardService.getFinancialReport({ year: selectedYear })
          setFinancialData(data)
        }
      } catch (error) {
        console.error('Failed to fetch report:', error)
        toast.error('Failed to load report data')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [activeTab, dateRange, selectedYear])

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const blob = await dashboardService.exportReport(activeTab, format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${activeTab}-report.${format === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Report exported successfully')
    } catch {
      toast.error('Failed to export report')
    }
  }

  const tabs = [
    { key: 'population', label: 'Population' },
    { key: 'documents', label: 'Documents' },
    { key: 'financial', label: 'Financial' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">View and export barangay reports</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('excel')}
            className="btn btn-outline inline-flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Export Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* Population Report */}
          {activeTab === 'population' && populationData && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center">
                  <p className="text-3xl font-bold text-primary-600">{populationData.total}</p>
                  <p className="text-sm text-gray-500">Total Population</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-blue-600">{populationData.voters}</p>
                  <p className="text-sm text-gray-500">Registered Voters</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-green-600">{populationData.seniorCitizens}</p>
                  <p className="text-sm text-gray-500">Senior Citizens</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-purple-600">{populationData.pwd}</p>
                  <p className="text-sm text-gray-500">PWD</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Population by Gender</h3>
                  <div className="h-[300px] flex items-center justify-center">
                    <Doughnut
                      data={{
                        labels: ['Male', 'Female'],
                        datasets: [
                          {
                            data: [populationData.byGender.male, populationData.byGender.female],
                            backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(236, 72, 153, 0.8)'],
                            borderWidth: 0,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } },
                        cutout: '60%',
                      }}
                    />
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Population by Age Group</h3>
                  <div className="h-[300px]">
                    <Bar
                      data={{
                        labels: Object.keys(populationData.byAgeGroup),
                        datasets: [
                          {
                            label: 'Count',
                            data: Object.values(populationData.byAgeGroup),
                            backgroundColor: 'rgba(99, 102, 241, 0.8)',
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Report */}
          {activeTab === 'documents' && documentData && (
            <div className="space-y-6">
              {/* Date Filter */}
              <div className="card">
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                    <input
                      type="date"
                      className="input"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <input
                      type="date"
                      className="input"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="card text-center">
                  <p className="text-3xl font-bold text-primary-600">{documentData.total}</p>
                  <p className="text-sm text-gray-500">Total Documents</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-green-600">
                    ₱{documentData.revenue?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {Object.keys(documentData.byType || {}).length}
                  </p>
                  <p className="text-sm text-gray-500">Document Types</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents by Type</h3>
                  <div className="h-[300px]">
                    <Bar
                      data={{
                        labels: Object.keys(documentData.byType || {}),
                        datasets: [
                          {
                            label: 'Count',
                            data: Object.values(documentData.byType || {}),
                            backgroundColor: 'rgba(99, 102, 241, 0.8)',
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        plugins: { legend: { display: false } },
                      }}
                    />
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents by Status</h3>
                  <div className="h-[300px] flex items-center justify-center">
                    <Doughnut
                      data={{
                        labels: Object.keys(documentData.byStatus || {}),
                        datasets: [
                          {
                            data: Object.values(documentData.byStatus || {}),
                            backgroundColor: [
                              'rgba(251, 191, 36, 0.8)',
                              'rgba(59, 130, 246, 0.8)',
                              'rgba(34, 197, 94, 0.8)',
                              'rgba(239, 68, 68, 0.8)',
                            ],
                            borderWidth: 0,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } },
                        cutout: '60%',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Financial Report */}
          {activeTab === 'financial' && financialData && (
            <div className="space-y-6">
              {/* Year Filter */}
              <div className="card">
                <div className="flex items-end gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <select
                      className="input"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                    >
                      {[...Array(5)].map((_, i) => {
                        const year = new Date().getFullYear() - i
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="card text-center">
                  <p className="text-3xl font-bold text-green-600">
                    ₱{financialData.total?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    ₱{financialData.documentFees?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-500">Document Fees</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    ₱{financialData.permitFees?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-500">Permit Fees</p>
                </div>
              </div>

              {/* Monthly Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
                <div className="h-[300px]">
                  <Bar
                    data={{
                      labels: financialData.byMonth?.map((m) => m.month) || [],
                      datasets: [
                        {
                          label: 'Revenue (₱)',
                          data: financialData.byMonth?.map((m) => m.amount) || [],
                          backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

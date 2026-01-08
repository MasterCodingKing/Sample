import api from './api'
import type { DashboardStats, Barangay } from '../types'

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/reports/dashboard')
    return response.data
  },

  getPopulationReport: async (): Promise<{
    total: number
    byGender: { male: number; female: number }
    byAgeGroup: Record<string, number>
    byCivilStatus: Record<string, number>
    byPurok: Record<string, number>
    voters: number
    pwd: number
    seniorCitizens: number
    soloParents: number
  }> => {
    const response = await api.get('/reports/population')
    return response.data
  },

  getDocumentReport: async (params?: { from?: string; to?: string }): Promise<{
    total: number
    byType: Record<string, number>
    byStatus: Record<string, number>
    revenue: number
    monthlyTrend: { month: string; count: number; revenue: number }[]
  }> => {
    const queryParams = new URLSearchParams()
    if (params?.from) queryParams.append('from', params.from)
    if (params?.to) queryParams.append('to', params.to)
    const response = await api.get(`/reports/documents?${queryParams.toString()}`)
    return response.data
  },

  getFinancialReport: async (params?: { year?: number }): Promise<{
    documentFees: number
    permitFees: number
    otherFees: number
    total: number
    byMonth: { month: string; amount: number }[]
  }> => {
    const queryParams = new URLSearchParams()
    if (params?.year) queryParams.append('year', String(params.year))
    const response = await api.get(`/reports/financial?${queryParams.toString()}`)
    return response.data
  },

  exportReport: async (type: string, format: 'excel' | 'pdf', params?: Record<string, string>): Promise<Blob> => {
    const queryParams = new URLSearchParams({ format, ...params })
    const response = await api.get(`/reports/${type}/export?${queryParams.toString()}`, {
      responseType: 'blob',
    })
    return response.data
  },
}

export const barangayService = {
  getAll: async (): Promise<Barangay[]> => {
    const response = await api.get('/barangays')
    return response.data.barangays || response.data
  },

  getById: async (id: number): Promise<Barangay> => {
    const response = await api.get(`/barangays/${id}`)
    return response.data.barangay || response.data
  },

  create: async (data: Partial<Barangay>): Promise<Barangay> => {
    const response = await api.post('/barangays', data)
    return response.data.barangay || response.data
  },

  update: async (id: number, data: Partial<Barangay>): Promise<Barangay> => {
    const response = await api.put(`/barangays/${id}`, data)
    return response.data.barangay || response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/barangays/${id}`)
  },

  getStatistics: async (id: number): Promise<{
    residents: number
    households: number
    businesses: number
    documents: number
    incidents: number
  }> => {
    const response = await api.get(`/barangays/${id}/statistics`)
    return response.data
  },
}

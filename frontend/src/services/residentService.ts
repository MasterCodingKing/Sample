import api from './api'
import type { Resident, PaginatedResponse } from '../types'

export interface ResidentFilters {
  search?: string
  status?: string
  gender?: string
  civil_status?: string
  voter_status?: string
  purok?: string
  is_voter?: boolean | string
  is_pwd?: boolean
  is_senior?: boolean
  page?: number
  limit?: number
}

export const residentService = {
  getAll: async (filters: ResidentFilters = {}): Promise<PaginatedResponse<Resident>> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value))
      }
    })
    const response = await api.get(`/residents?${params.toString()}`)
    return response.data
  },

  getById: async (id: number): Promise<Resident> => {
    const response = await api.get(`/residents/${id}`)
    return response.data.resident || response.data
  },

  create: async (data: Partial<Resident>): Promise<Resident> => {
    const response = await api.post('/residents', data)
    return response.data.resident || response.data
  },

  update: async (id: number, data: Partial<Resident>): Promise<Resident> => {
    const response = await api.put(`/residents/${id}`, data)
    return response.data.resident || response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/residents/${id}`)
  },

  uploadPhoto: async (id: number, file: File): Promise<{ photo_url: string }> => {
    const formData = new FormData()
    formData.append('photo', file)
    const response = await api.post(`/residents/${id}/upload-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  getStatistics: async (): Promise<{
    total: number
    byGender: { male: number; female: number }
    byAgeGroup: Record<string, number>
    byStatus: Record<string, number>
  }> => {
    const response = await api.get('/residents/statistics')
    return response.data
  },

  search: async (query: string): Promise<Resident[]> => {
    const response = await api.get(`/residents/search?q=${encodeURIComponent(query)}`)
    return response.data.residents || response.data
  },
}

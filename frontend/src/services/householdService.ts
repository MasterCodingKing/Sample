import api from './api'
import type { Household, PaginatedResponse } from '../types'

export interface HouseholdFilters {
  search?: string
  status?: string
  purok?: string
  housing_type?: string
  page?: number
  limit?: number
}

export const householdService = {
  getAll: async (filters: HouseholdFilters = {}): Promise<PaginatedResponse<Household>> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value))
      }
    })
    const response = await api.get(`/households?${params.toString()}`)
    return response.data
  },

  getById: async (id: number): Promise<Household> => {
    const response = await api.get(`/households/${id}`)
    return response.data.household || response.data
  },

  create: async (data: Partial<Household>): Promise<Household> => {
    const response = await api.post('/households', data)
    return response.data.household || response.data
  },

  update: async (id: number, data: Partial<Household>): Promise<Household> => {
    const response = await api.put(`/households/${id}`, data)
    return response.data.household || response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/households/${id}`)
  },

  getMembers: async (id: number): Promise<{ members: unknown[] }> => {
    const response = await api.get(`/households/${id}/members`)
    return response.data
  },

  addMember: async (id: number, residentId: number): Promise<void> => {
    await api.post(`/households/${id}/members`, { resident_id: residentId })
  },

  removeMember: async (id: number, residentId: number): Promise<void> => {
    await api.delete(`/households/${id}/members/${residentId}`)
  },

  getStatistics: async (): Promise<{
    total: number
    byHousingType: Record<string, number>
    byStatus: Record<string, number>
    averageMembers: number
  }> => {
    const response = await api.get('/households/statistics')
    return response.data
  },
}

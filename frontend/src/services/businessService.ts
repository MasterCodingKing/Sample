import api from './api'
import type { Business, BusinessPermit, PaginatedResponse } from '../types'

export interface BusinessFilters {
  search?: string
  status?: string
  business_type?: string
  business_category?: string
  page?: number
  limit?: number
}

export const businessService = {
  // Businesses
  getAll: async (filters: BusinessFilters = {}): Promise<PaginatedResponse<Business>> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value))
      }
    })
    const response = await api.get(`/businesses?${params.toString()}`)
    return response.data
  },

  getById: async (id: number): Promise<Business> => {
    const response = await api.get(`/businesses/${id}`)
    return response.data.business || response.data
  },

  create: async (data: Partial<Business>): Promise<Business> => {
    const response = await api.post('/businesses', data)
    return response.data.business || response.data
  },

  update: async (id: number, data: Partial<Business>): Promise<Business> => {
    const response = await api.put(`/businesses/${id}`, data)
    return response.data.business || response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/businesses/${id}`)
  },

  // Business Permits
  getPermits: async (filters: { business_id?: number; status?: string; year?: number; page?: number; limit?: number } = {}): Promise<PaginatedResponse<BusinessPermit>> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value))
      }
    })
    const response = await api.get(`/business-permits?${params.toString()}`)
    return response.data
  },

  getPermitById: async (id: number): Promise<BusinessPermit> => {
    const response = await api.get(`/business-permits/${id}`)
    return response.data.permit || response.data
  },

  createPermit: async (data: Partial<BusinessPermit>): Promise<BusinessPermit> => {
    const response = await api.post('/business-permits', data)
    return response.data.permit || response.data
  },

  updatePermitStatus: async (id: number, status: string, data?: object): Promise<BusinessPermit> => {
    const response = await api.put(`/business-permits/${id}/status`, { status, ...data })
    return response.data.permit || response.data
  },

  getExpiringPermits: async (): Promise<BusinessPermit[]> => {
    const response = await api.get('/business-permits/expiring')
    return response.data.permits || response.data
  },

  getStatistics: async (): Promise<{
    totalBusinesses: number
    byType: Record<string, number>
    byCategory: Record<string, number>
    permitStats: {
      pending: number
      approved: number
      expired: number
    }
  }> => {
    const response = await api.get('/businesses/statistics')
    return response.data
  },
}

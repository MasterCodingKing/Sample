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

// Transform frontend field names to backend field names
const transformResidentData = (data: Partial<Resident>): Record<string, unknown> => {
  const transformed: Record<string, unknown> = { ...data }
  
  // Map frontend fields to backend fields
  if (data.birthdate !== undefined) {
    transformed.date_of_birth = data.birthdate
    delete transformed.birthdate
  }
  if (data.birthplace !== undefined) {
    transformed.place_of_birth = data.birthplace
    delete transformed.birthplace
  }
  if (data.purok !== undefined) {
    transformed.zone_purok = data.purok
    delete transformed.purok
  }
  if (data.is_voter !== undefined) {
    transformed.voter_status = data.is_voter
    delete transformed.is_voter
  }
  if (data.education !== undefined) {
    transformed.education_level = data.education
    delete transformed.education
  }
  if (data.is_senior !== undefined) {
    transformed.is_senior_citizen = data.is_senior
    delete transformed.is_senior
  }
  
  // Clean up empty string values for optional fields
  Object.keys(transformed).forEach(key => {
    if (transformed[key] === '' || transformed[key] === undefined) {
      delete transformed[key]
    }
  })
  
  return transformed
}

// Transform backend field names to frontend field names for getById
const transformResidentResponse = (data: Record<string, unknown>): Resident => {
  return {
    ...data,
    birthdate: data.date_of_birth as string,
    birthplace: data.place_of_birth as string,
    purok: data.zone_purok as string,
    is_voter: data.voter_status as boolean,
    education: data.education_level as string,
    is_senior: data.is_senior_citizen as boolean,
  } as Resident
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
    const residentData = response.data.resident || response.data
    return transformResidentResponse(residentData)
  },

  create: async (data: Partial<Resident>): Promise<Resident> => {
    const transformedData = transformResidentData(data)
    const response = await api.post('/residents', transformedData)
    return response.data.resident || response.data
  },

  update: async (id: number, data: Partial<Resident>): Promise<Resident> => {
    const transformedData = transformResidentData(data)
    const response = await api.put(`/residents/${id}`, transformedData)
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

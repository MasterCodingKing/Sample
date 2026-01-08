import api from './api'
import type { Incident, PaginatedResponse, IncidentType, IncidentStatus } from '../types'

export interface IncidentFilters {
  search?: string
  incident_type?: IncidentType
  status?: IncidentStatus
  priority?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}

export const incidentService = {
  getAll: async (filters: IncidentFilters = {}): Promise<PaginatedResponse<Incident>> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value))
      }
    })
    const response = await api.get(`/incidents?${params.toString()}`)
    return response.data
  },

  getById: async (id: number): Promise<Incident> => {
    const response = await api.get(`/incidents/${id}`)
    return response.data.incident || response.data
  },

  create: async (data: Partial<Incident>): Promise<Incident> => {
    const response = await api.post('/incidents', data)
    return response.data.incident || response.data
  },

  update: async (id: number, data: Partial<Incident>): Promise<Incident> => {
    const response = await api.put(`/incidents/${id}`, data)
    return response.data.incident || response.data
  },

  updateStatus: async (id: number, status: IncidentStatus, data?: { action_taken?: string; resolution?: string }): Promise<Incident> => {
    const response = await api.put(`/incidents/${id}/status`, { status, ...data })
    return response.data.incident || response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/incidents/${id}`)
  },

  getStatistics: async (): Promise<{
    total: number
    byType: Record<string, number>
    byStatus: Record<string, number>
    byPriority: Record<string, number>
    monthlyTrend: { month: string; count: number }[]
  }> => {
    const response = await api.get('/incidents/statistics')
    return response.data
  },

  getIncidentTypes: () => [
    { value: 'physical_assault', label: 'Physical Assault' },
    { value: 'verbal_abuse', label: 'Verbal Abuse' },
    { value: 'property_dispute', label: 'Property Dispute' },
    { value: 'noise_complaint', label: 'Noise Complaint' },
    { value: 'domestic_violence', label: 'Domestic Violence' },
    { value: 'theft', label: 'Theft' },
    { value: 'trespassing', label: 'Trespassing' },
    { value: 'public_disturbance', label: 'Public Disturbance' },
    { value: 'animal_complaint', label: 'Animal Complaint' },
    { value: 'traffic_incident', label: 'Traffic Incident' },
    { value: 'other', label: 'Other' },
  ],

  getStatusOptions: () => [
    { value: 'reported', label: 'Reported', color: 'gray' },
    { value: 'under_investigation', label: 'Under Investigation', color: 'yellow' },
    { value: 'scheduled_hearing', label: 'Scheduled Hearing', color: 'blue' },
    { value: 'mediation', label: 'Mediation', color: 'purple' },
    { value: 'resolved', label: 'Resolved', color: 'green' },
    { value: 'escalated', label: 'Escalated', color: 'red' },
    { value: 'dismissed', label: 'Dismissed', color: 'gray' },
  ],
}

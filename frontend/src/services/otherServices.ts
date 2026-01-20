import api from './api'
import type { Official, Announcement, Event, PaginatedResponse } from '../types'

// Helper function to clean data before sending to API
const cleanDataWithDates = (data: Record<string, unknown>, dateFields: string[]): Record<string, unknown> => {
  const cleaned: Record<string, unknown> = {}
  
  Object.entries(data).forEach(([key, value]) => {
    // Skip empty strings, undefined, and null values for optional fields
    if (value === '' || value === undefined || value === null) {
      return
    }
    
    // Handle date fields - convert empty or invalid dates to null
    if (dateFields.includes(key)) {
      if (value && !isNaN(Date.parse(String(value)))) {
        cleaned[key] = value
      }
      return
    }
    
    cleaned[key] = value
  })
  
  return cleaned
}

// Officials Service
export const officialService = {
  getAll: async (params?: { is_current?: boolean; position?: string }): Promise<Official[]> => {
    const queryParams = new URLSearchParams()
    if (params?.is_current !== undefined) queryParams.append('is_current', String(params.is_current))
    if (params?.position) queryParams.append('position', params.position)
    const response = await api.get(`/officials?${queryParams.toString()}`)
    return response.data.officials || response.data
  },

  getById: async (id: number): Promise<Official> => {
    const response = await api.get(`/officials/${id}`)
    return response.data.official || response.data
  },

  create: async (data: Partial<Official>): Promise<Official> => {
    const cleanedData = cleanDataWithDates(data as Record<string, unknown>, ['term_start', 'term_end'])
    const response = await api.post('/officials', cleanedData)
    return response.data.official || response.data
  },

  update: async (id: number, data: Partial<Official>): Promise<Official> => {
    const cleanedData = cleanDataWithDates(data as Record<string, unknown>, ['term_start', 'term_end'])
    const response = await api.put(`/officials/${id}`, cleanedData)
    return response.data.official || response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/officials/${id}`)
  },

  getPositions: () => [
    { value: 'captain', label: 'Barangay Captain' },
    { value: 'kagawad', label: 'Kagawad' },
    { value: 'secretary', label: 'Barangay Secretary' },
    { value: 'treasurer', label: 'Barangay Treasurer' },
    { value: 'sk_chairman', label: 'SK Chairman' },
    { value: 'sk_kagawad', label: 'SK Kagawad' },
    { value: 'tanod', label: 'Barangay Tanod' },
    { value: 'lupon', label: 'Lupon Member' },
    { value: 'bhw', label: 'Barangay Health Worker' },
    { value: 'other', label: 'Other' },
  ],
}

// Announcements Service
export const announcementService = {
  getAll: async (params?: { status?: string; category?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Announcement>> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value))
      })
    }
    const response = await api.get(`/announcements?${queryParams.toString()}`)
    return response.data
  },

  getById: async (id: number): Promise<Announcement> => {
    const response = await api.get(`/announcements/${id}`)
    return response.data.announcement || response.data
  },

  create: async (data: Partial<Announcement>): Promise<Announcement> => {
    const cleanedData = cleanDataWithDates(data as Record<string, unknown>, ['publish_date', 'expiry_date'])
    const response = await api.post('/announcements', cleanedData)
    return response.data.announcement || response.data
  },

  update: async (id: number, data: Partial<Announcement>): Promise<Announcement> => {
    const cleanedData = cleanDataWithDates(data as Record<string, unknown>, ['publish_date', 'expiry_date'])
    const response = await api.put(`/announcements/${id}`, cleanedData)
    return response.data.announcement || response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/announcements/${id}`)
  },

  publish: async (id: number): Promise<Announcement> => {
    const response = await api.put(`/announcements/${id}/publish`)
    return response.data.announcement || response.data
  },

  getCategories: () => [
    { value: 'general', label: 'General' },
    { value: 'health', label: 'Health' },
    { value: 'education', label: 'Education' },
    { value: 'safety', label: 'Safety' },
    { value: 'environment', label: 'Environment' },
    { value: 'events', label: 'Events' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'advisory', label: 'Advisory' },
  ],
}

// Events Service
export const eventService = {
  getAll: async (params?: { status?: string; event_type?: string; from?: string; to?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Event>> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value))
      })
    }
    const response = await api.get(`/events?${queryParams.toString()}`)
    return response.data
  },

  getById: async (id: number): Promise<Event> => {
    const response = await api.get(`/events/${id}`)
    return response.data.event || response.data
  },

  create: async (data: Partial<Event>): Promise<Event> => {
    const cleanedData = cleanDataWithDates(data as Record<string, unknown>, ['start_date', 'end_date', 'registration_deadline'])
    const response = await api.post('/events', cleanedData)
    return response.data.event || response.data
  },

  update: async (id: number, data: Partial<Event>): Promise<Event> => {
    const cleanedData = cleanDataWithDates(data as Record<string, unknown>, ['start_date', 'end_date', 'registration_deadline'])
    const response = await api.put(`/events/${id}`, cleanedData)
    return response.data.event || response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/events/${id}`)
  },

  updateStatus: async (id: number, status: string): Promise<Event> => {
    const response = await api.put(`/events/${id}/status`, { status })
    return response.data.event || response.data
  },

  getEventTypes: () => [
    { value: 'meeting', label: 'Meeting' },
    { value: 'assembly', label: 'General Assembly' },
    { value: 'fiesta', label: 'Fiesta' },
    { value: 'medical_mission', label: 'Medical Mission' },
    { value: 'clean_up_drive', label: 'Clean Up Drive' },
    { value: 'sports', label: 'Sports Event' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'outreach', label: 'Outreach Program' },
    { value: 'other', label: 'Other' },
  ],
}

// Users Service
export const userService = {
  getAll: async (params?: { role?: string; status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<import('../types').User>> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value))
      })
    }
    const response = await api.get(`/users?${queryParams.toString()}`)
    return response.data
  },

  getById: async (id: number): Promise<import('../types').User> => {
    const response = await api.get(`/users/${id}`)
    return response.data.user || response.data
  },

  create: async (data: Partial<import('../types').User> & { password: string }): Promise<import('../types').User> => {
    const response = await api.post('/users', data)
    return response.data.user || response.data
  },

  update: async (id: number, data: Partial<import('../types').User>): Promise<import('../types').User> => {
    const response = await api.put(`/users/${id}`, data)
    return response.data.user || response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`)
  },

  toggleStatus: async (id: number): Promise<import('../types').User> => {
    const response = await api.put(`/users/${id}/toggle-status`)
    return response.data.user || response.data
  },

  getPendingApprovals: async (): Promise<{ users: import('../types').User[]; count: number }> => {
    const response = await api.get('/users/pending-approval/list')
    return response.data
  },

  approveUser: async (id: number): Promise<import('../types').User> => {
    const response = await api.put(`/users/${id}/approve`)
    return response.data.user || response.data
  },

  rejectUser: async (id: number): Promise<import('../types').User> => {
    const response = await api.put(`/users/${id}/reject`)
    return response.data.user || response.data
  },

  getRoles: () => [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'captain', label: 'Captain' },
    { value: 'secretary', label: 'Secretary' },
    { value: 'treasurer', label: 'Treasurer' },
    { value: 'staff', label: 'Staff' },
    { value: 'resident', label: 'Resident' },
  ],
}

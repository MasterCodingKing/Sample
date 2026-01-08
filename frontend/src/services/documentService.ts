import api from './api'
import type { Document, PaginatedResponse, DocumentType, DocumentStatus } from '../types'

export interface DocumentFilters {
  search?: string
  document_type?: DocumentType
  status?: DocumentStatus
  resident_id?: number
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}

export const documentService = {
  getAll: async (filters: DocumentFilters = {}): Promise<PaginatedResponse<Document>> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value))
      }
    })
    const response = await api.get(`/documents?${params.toString()}`)
    return response.data
  },

  getById: async (id: number): Promise<Document> => {
    const response = await api.get(`/documents/${id}`)
    return response.data.document || response.data
  },

  create: async (data: Partial<Document>): Promise<Document> => {
    const response = await api.post('/documents', data)
    return response.data.document || response.data
  },

  updateStatus: async (id: number, status: DocumentStatus, data?: { rejection_reason?: string; or_number?: string; amount?: number }): Promise<Document> => {
    const response = await api.put(`/documents/${id}/status`, { status, ...data })
    return response.data.document || response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/documents/${id}`)
  },

  downloadPdf: async (id: number): Promise<Blob> => {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  getStatistics: async (): Promise<{
    total: number
    byType: Record<string, number>
    byStatus: Record<string, number>
    totalRevenue: number
  }> => {
    const response = await api.get('/documents/statistics')
    return response.data
  },

  getDocumentTypes: () => [
    { value: 'barangay_clearance', label: 'Barangay Clearance', fee: 50 },
    { value: 'certificate_of_residency', label: 'Certificate of Residency', fee: 50 },
    { value: 'certificate_of_indigency', label: 'Certificate of Indigency', fee: 0 },
    { value: 'business_clearance', label: 'Business Clearance', fee: 100 },
    { value: 'barangay_id', label: 'Barangay ID', fee: 100 },
    { value: 'cedula', label: 'Cedula', fee: 50 },
    { value: 'first_time_job_seeker', label: 'First Time Job Seeker', fee: 0 },
    { value: 'good_moral_certificate', label: 'Good Moral Certificate', fee: 50 },
    { value: 'lot_ownership', label: 'Lot Ownership Certificate', fee: 100 },
    { value: 'travel_permit', label: 'Travel Permit', fee: 50 },
    { value: 'other', label: 'Other', fee: 50 },
  ],
}

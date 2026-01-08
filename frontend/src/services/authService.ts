import api from './api'
import type { LoginCredentials, RegisterData, AuthResponse, User } from '../types'

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data.user || response.data
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await api.get(`/auth/verify-email/${token}`)
    return response.data
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword })
    return response.data
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/auth/update-profile', data)
    return response.data.user || response.data
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await api.post('/auth/refresh-token', { refreshToken })
    return response.data
  },
}

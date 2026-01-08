import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { authService } from '../services/authService'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; first_name: string; last_name: string; barangay_id?: number }) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setToken: (token: string) => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        try {
          const response = await authService.login({ email, password })
          const token = response.accessToken || response.token || null
          set({
            user: response.user,
            token,
            refreshToken: response.refreshToken || null,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (data) => {
        try {
          const response = await authService.register(data)
          set({
            user: response.user,
            token: response.accessToken || response.token || null,
            refreshToken: response.refreshToken || null,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await authService.logout()
        } catch {
          // Ignore logout errors
        } finally {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      checkAuth: async () => {
        const token = get().token
        const refreshToken = get().refreshToken
        if (!token) {
          set({ isLoading: false, isAuthenticated: false })
          return
        }

        try {
          const user = await authService.getMe()
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          // If token is expired and we have a refresh token, try to refresh
          if (error.response?.data?.code === 'TOKEN_EXPIRED' && refreshToken) {
            try {
              const response = await authService.refreshToken(refreshToken)
              set({ 
                token: response.accessToken,
                refreshToken: response.refreshToken,
                isLoading: false 
              })
              // Retry getting user info with new token
              const user = await authService.getMe()
              set({
                user,
                isAuthenticated: true,
              })
              return
            } catch (refreshError) {
              console.error('[Auth Store] Token refresh failed:', refreshError)
            }
          }
          
          // If we couldn't refresh or token is invalid, clear auth
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      setToken: (token: string) => {
        set({ token })
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Check auth after rehydration completes
        if (state?.token) {
          state.checkAuth()
        } else if (state) {
          state.isLoading = false
        }
      },
    }
  )
)

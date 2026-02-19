import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '../services/api'

export type UserRole = 'admin' | 'doctor' | 'patient' | 'secretary'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
  
  // Actions
  setTokens: (access: string, refresh: string) => void
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
  isTokenValid: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      
      setTokens: (access, refresh) => set({
        accessToken: access,
        refreshToken: refresh,
        isAuthenticated: true,
      }),
      
      setAccessToken: (token) => set({ accessToken: token }),
      
      setUser: (user) => set({ user }),
      
      logout: () => {
        const rememberMe = localStorage.getItem('rememberMe') === 'true'
        
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        })
        
        localStorage.removeItem('auth-storage')
        
        if (!rememberMe) {
          localStorage.removeItem('rememberMe')
        }
      },
      
      isTokenValid: () => {
        return !!get().accessToken && get().isAuthenticated
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Hook utilitaire pour les permissions
export function useAuthPermissions() {
  const { user } = useAuthStore()
  
  return {
    isAdmin: user?.role === 'admin',
    isDoctor: user?.role === 'doctor',
    isPatient: user?.role === 'patient',
    isSecretary: user?.role === 'secretary',
    canManageDoctors: user?.role === 'admin',
    canManagePatients: ['admin', 'doctor', 'secretary'].includes(user?.role || ''),
    canViewStats: ['admin', 'secretary'].includes(user?.role || ''),
    canReserveTicket: user?.role === 'patient',
  }
}
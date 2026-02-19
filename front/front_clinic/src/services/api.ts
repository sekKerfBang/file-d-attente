import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'

const rawUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const API_BASE_URL = rawUrl.trim().replace(/\/+$/, '')

console.log('🔧 API_BASE_URL:', API_BASE_URL)

// Types
export interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'doctor' | 'patient' | 'secretary'
  role_display: string
  specialty?: string
  phone?: string
  date_of_birth?: string
  is_active_account: boolean
}

export interface Doctor {
  id: string
  name: string
  email: string
  specialty: string
  is_active: boolean
  current_patient?: Patient | null
  patients_seen_today: number
  average_consultation_time: number
  room_number?: string
}

export interface Patient {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  priority: number
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled'
  assigned_doctor?: string
  created_at: string
  updated_at: string
  called_at?: string
  completed_at?: string
  estimated_wait_time?: number
  reason?: string
}

export interface QueueStats {
  total_waiting: number
  total_in_progress: number
  total_completed_today: number
  total_cancelled_today: number
  urgent_count: number
  average_wait_time: number
  average_consultation_time: number
  doctor_stats: Array<{
    id: string
    name: string
    patients_seen_today: number
    average_consultation_time: number
  }>
}

// Réponse paginée de Django REST Framework
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Helper pour extraire les résultats paginés ou retourner directement
function extractResults<T>(response: { data: T[] | PaginatedResponse<T> }): T[] {
  const data = response.data
  
  // Si c'est une réponse paginée (a la propriété results)
  if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
    console.log('📄 Réponse paginée détectée, extraction de', data.results.length, 'résultats')
    return data.results
  }
  
  // Si c'est déjà un tableau
  if (Array.isArray(data)) {
    return data
  }
  
  // Fallback
  console.warn('⚠️ Format de réponse inattendu:', data)
  return []
}

// Instances Axios
export const publicApi = axios.create({
  baseURL: `${API_BASE_URL}/api/`,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000,
  withCredentials: false
})

export const privateApi = axios.create({
  baseURL: `${API_BASE_URL}/api/`,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000,
  withCredentials: false
})

// Intercepteurs
privateApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

privateApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) throw new Error('No refresh token')
        
        const response = await publicApi.post<{ access: string }>('auth/refresh/', { 
          refresh: refreshToken 
        })
        
        const { access } = response.data
        useAuthStore.getState().setAccessToken(access)
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`
        }
        
        return privateApi(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().logout()
        window.location.href = '/login?session=expired'
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

// APIs
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    publicApi.post<{ access: string; refresh: string; user: User }>('auth/login/', credentials),
  
  register: (data: { 
    username: string
    email: string
    password: string
    first_name?: string
    last_name?: string
    role?: 'patient' | 'doctor'
    phone?: string
    date_of_birth?: string
    specialty?: string
  }) => publicApi.post<User>('auth/register/', data),
  
  refresh: (refreshToken: string) =>
    publicApi.post<{ access: string }>('auth/refresh/', { refresh: refreshToken }),
  
  verify: (token: string) =>
    publicApi.post('auth/verify/', { token }),
  
  // CORRECTION : Envoyer le refresh token pour le blacklist
  logout: (refreshToken: string) => 
    privateApi.post('auth/logout/', { refresh: refreshToken }),
  // logout: () => privateApi.post('auth/logout/'),
  
  me: () => privateApi.get<User>('auth/me/'),
}

export const doctorApi = {
  getAll: async (): Promise<Doctor[]> => {
    const response = await privateApi.get<Doctor[] | PaginatedResponse<Doctor>>('doctors/')
    return extractResults(response)
  },
  
  getById: async (id: string): Promise<Doctor> => {
    const response = await privateApi.get<Doctor>(`doctors/${id}/`)
    return response.data
  },
  
  callNext: async (id: string): Promise<{ patient: Patient | null; message: string }> => {
    const response = await privateApi.post(`doctors/${id}/call_next/`)
    return response.data
  },
  
  finishCurrent: async (id: string): Promise<{ patient: Patient | null; message: string }> => {
    const response = await privateApi.post(`doctors/${id}/finish_current/`)
    return response.data
  },
  
  updateStatus: async (id: string, isActive: boolean): Promise<Doctor> => {
    const response = await privateApi.patch<Doctor>(`doctors/${id}/`, { is_active: isActive })
    return response.data
  },
}

export const patientApi = {
  getAll: async (params?: { status?: string; priority?: number }): Promise<Patient[]> => {
    const response = await privateApi.get<Patient[] | PaginatedResponse<Patient>>('patients/', { params })
    return extractResults(response)
  },
  
  getById: async (id: string): Promise<Patient> => {
    const response = await privateApi.get<Patient>(`patients/${id}/`)
    return response.data
  },
  
  create: async (data: Partial<Patient>): Promise<Patient> => {
    const response = await privateApi.post<Patient>('patients/', data)
    return response.data
  },
  
  cancel: async (id: string): Promise<Patient> => {
    const response = await privateApi.post<Patient>(`patients/${id}/cancel/`)
    return response.data
  },
  
  updatePriority: async (id: string, priority: number): Promise<Patient> => {
    const response = await privateApi.patch<Patient>(`patients/${id}/`, { priority })
    return response.data
  },
  
  update: async (id: string, data: Partial<Patient>): Promise<Patient> => {
    const response = await privateApi.patch<Patient>(`patients/${id}/`, data)
    return response.data
  },
}

export const statsApi = {
  getStats: async (): Promise<QueueStats> => {
    const response = await privateApi.get<QueueStats>('stats/')
    // Stats n'est pas paginé normalement, on retourne directement
    return response.data
  },
}
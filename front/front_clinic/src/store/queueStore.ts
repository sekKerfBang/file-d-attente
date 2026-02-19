import { create } from 'zustand'
import type { Doctor, Patient, QueueStats } from '../services/api'

interface QueueState {
  // Données
  doctors: Doctor[]
  patients: Patient[]
  stats: QueueStats | null
  isLoading: boolean
  error: string | null
  
  // Actions de base
  setDoctors: (doctors: Doctor[]) => void
  setPatients: (patients: Patient[]) => void
  setStats: (stats: QueueStats | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Actions métier
  addDoctor: (doctor: Doctor) => void
  updateDoctor: (id: string, updates: Partial<Doctor>) => void
  removeDoctor: (id: string) => void
  
  addPatient: (patient: Patient) => void
  updatePatient: (id: string, updates: Partial<Patient>) => void
  removePatient: (id: string) => void
  
  // Sélecteurs (computed)
  waitingPatients: () => Patient[]
  inProgressPatients: () => Patient[]
  completedPatients: () => Patient[]
  urgentPatients: () => Patient[]
  activeDoctors: () => Doctor[]
  getDoctorById: (id: string) => Doctor | undefined
  getPatientById: (id: string) => Patient | undefined
}

export const useQueueStore = create<QueueState>((set, get) => ({
  // État initial
  doctors: [],
  patients: [],
  stats: null,
  isLoading: false,
  error: null,
  
  // Setters de base
  setDoctors: (doctors) => set({ doctors }),
  setPatients: (patients) => set({ patients }),
  setStats: (stats) => set({ stats }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  // Actions médecins
  addDoctor: (doctor) => set((state) => ({ 
    doctors: [...state.doctors, doctor] 
  })),
  
  updateDoctor: (id, updates) => set((state) => ({
    doctors: state.doctors.map((d) => 
      d.id === id ? { ...d, ...updates } : d
    ),
  })),
  
  removeDoctor: (id) => set((state) => ({
    doctors: state.doctors.filter((d) => d.id !== id),
  })),
  
  // Actions patients
  addPatient: (patient) => set((state) => ({ 
    patients: [...state.patients, patient] 
  })),
  
  updatePatient: (id, updates) => set((state) => ({
    patients: state.patients.map((p) => 
      p.id === id ? { ...p, ...updates } : p
    ),
  })),
  
  removePatient: (id) => set((state) => ({
    patients: state.patients.filter((p) => p.id !== id),
  })),
  
  // Sélecteurs
  waitingPatients: () => {
    return get().patients
      .filter((p) => p.status === 'waiting')
      .sort((a, b) => {
        // Tri par priorité (1 = urgence, 5 = non urgent)
        if (a.priority !== b.priority) return a.priority - b.priority
        // Puis par date de création
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })
  },
  
  inProgressPatients: () => {
    return get().patients.filter((p) => p.status === 'in_progress')
  },
  
  completedPatients: () => {
    return get().patients.filter((p) => p.status === 'completed')
  },
  
  urgentPatients: () => {
    return get().patients.filter((p) => p.priority === 1 && p.status === 'waiting')
  },
  
  activeDoctors: () => {
    return get().doctors.filter((d) => d.is_active)
  },
  
  getDoctorById: (id) => {
    return get().doctors.find((d) => d.id === id)
  },
  
  getPatientById: (id) => {
    return get().patients.find((p) => p.id === id)
  },
}))
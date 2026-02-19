import { useEffect, useState, useCallback } from 'react'
import { useQueueStore } from '../store/queueStore'
import { doctorApi, patientApi } from '../services/api'
import type { Patient } from '../services/api'
import DoctorCard from '../components/DoctorCard'
import PatientList from '../components/PatientList'
import { RefreshCw, UserPlus, Filter, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type TabType = 'waiting' | 'in_progress' | 'completed' | 'all'

export default function QueueManagement() {
  const navigate = useNavigate()
  const { 
    doctors, 
    patients, 
    setDoctors, 
    setPatients, 
    updatePatient,
    removePatient,
    waitingPatients,
    inProgressPatients,
    activeDoctors
  } = useQueueStore()
  
  const [activeTab, setActiveTab] = useState<TabType>('waiting')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<string | 'all'>('all')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [doctorsData, patientsData] = await Promise.all([
        doctorApi.getAll(),
        patientApi.getAll()
      ])
      
      setDoctors(doctorsData)
      setPatients(patientsData)
    } catch (err: any) {
      console.error('Erreur chargement:', err)
      setError(err.message || 'Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }, [setDoctors, setPatients])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleCallNext = async (doctorId: string) => {
    try {
      const response = await doctorApi.callNext(doctorId)
      
      if (response.patient) {
        updatePatient(response.patient.id, {
          status: 'in_progress',
          assigned_doctor: doctorId,
          called_at: new Date().toISOString()
        })
      }
      
      loadData()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Erreur lors de l\'appel du patient')
    }
  }

  const handleFinish = async (doctorId: string) => {
    try {
      const response = await doctorApi.finishCurrent(doctorId)
      
      if (response.patient) {
        updatePatient(response.patient.id, {
          status: 'completed',
          completed_at: new Date().toISOString()
        })
      }
      
      loadData()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Erreur lors de la fin de consultation')
    }
  }

  const handleCancel = async (patientId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce patient ?')) return
    
    try {
      await patientApi.cancel(patientId)
      removePatient(patientId)
      loadData()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Erreur lors de l\'annulation')
    }
  }

  const handlePriorityChange = async (patientId: string, newPriority: number) => {
    try {
      await patientApi.updatePriority(patientId, newPriority)
      updatePatient(patientId, { priority: newPriority })
    } catch (error) {
      console.error('Erreur priorité:', error)
      alert('Erreur lors de la modification de la priorité')
    }
  }

  const filteredPatients = patients.filter((p: Patient) => {
    if (activeTab !== 'all' && p.status !== activeTab) return false
    if (selectedDoctor !== 'all' && p.assigned_doctor !== selectedDoctor) return false
    return true
  })

  const tabs = [
    { key: 'waiting' as TabType, label: 'En attente', count: waitingPatients().length },
    { key: 'in_progress' as TabType, label: 'En cours', count: inProgressPatients().length },
    { key: 'completed' as TabType, label: 'Terminés', count: patients.filter(p => p.status === 'completed').length },
    { key: 'all' as TabType, label: 'Tous', count: patients.length }
  ]

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-700">{error}</p>
          <button onClick={loadData} className="btn-primary mt-4">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion de la file</h2>
          <p className="text-sm text-gray-500">Gérez les patients et les consultations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/patients/new')}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Nouveau patient
          </button>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="btn-secondary"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne médecins */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            Médecins
            <span className="text-sm font-normal text-gray-500">
              ({activeDoctors().length})
            </span>
          </h3>
          
          <div className="space-y-3">
            {activeDoctors().map(doctor => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onCallNext={handleCallNext}
                onFinish={handleFinish}
                isBusy={!!doctor.current_patient}
              />
            ))}
          </div>

          {activeDoctors().length === 0 && (
            <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
              Aucun médecin actif
            </div>
          )}
        </div>

        {/* Colonne patients */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {activeTab === 'in_progress' && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="text-sm border rounded-lg px-3 py-2"
                >
                  <option value="all">Tous les médecins</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>Dr. {d.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Liste des patients */}
          <PatientList 
            patients={filteredPatients}
            onCancel={handleCancel}
            onPriorityChange={handlePriorityChange}
            showActions={true}
            emptyMessage={
              activeTab === 'waiting' ? "Aucun patient en attente" :
              activeTab === 'in_progress' ? "Aucune consultation en cours" :
              activeTab === 'completed' ? "Aucun patient terminé aujourd'hui" :
              "Aucun patient"
            }
          />
        </div>
      </div>
    </div>
  )
}
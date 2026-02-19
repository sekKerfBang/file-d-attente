import { useEffect, useState } from 'react'
import { doctorApi } from '../services/api'
import type { Doctor } from '../types'
import { 
  UserPlus, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle,
  Stethoscope,
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadDoctors()
  }, [])

  const loadDoctors = async () => {
    try {
      const data = await doctorApi.getAll()
      setDoctors(data)
    } catch (error) {
      console.error('Erreur chargement médecins:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleDoctorStatus = async (doctorId: string, currentStatus: boolean) => {
    try {
      await doctorApi.updateStatus(doctorId, !currentStatus)
      loadDoctors()
    } catch (error) {
      alert('Erreur lors de la mise à jour du statut')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Médecins</h2>
          <p className="text-sm text-gray-500">
            {doctors.filter(d => d.is_active).length} actif(s) sur {doctors.length}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Ajouter un médecin
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <div 
            key={doctor.id} 
            className={`card ${doctor.is_active ? 'border-green-200 bg-green-50/30' : 'border-gray-200 opacity-75'}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  doctor.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Dr. {doctor.name}</h3>
                  <p className="text-sm text-gray-500">{doctor.specialty || 'Médecin généraliste'}</p>
                </div>
              </div>
              <button
                onClick={() => toggleDoctorStatus(doctor.id, doctor.is_active)}
                className={`p-2 rounded-lg transition-colors ${
                  doctor.is_active 
                    ? 'text-green-600 hover:bg-green-100' 
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={doctor.is_active ? 'Désactiver' : 'Activer'}
              >
                {doctor.is_active ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </button>
            </div>

            <div className="space-y-2 text-sm">
              {doctor.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  {doctor.email}
                </div>
              )}
              {doctor.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  {doctor.phone}
                </div>
              )}
            </div>

            {doctor.is_active && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Patients aujourd'hui</span>
                  <span className="font-semibold">{doctor.patients_seen_today || 0}</span>
                </div>
                {doctor.current_patient && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg text-sm">
                    <span className="text-blue-600 font-medium">En consultation:</span>
                    <span className="ml-2 text-gray-700">
                      {doctor.current_patient.first_name} {doctor.current_patient.last_name}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Dernière activité: {format(new Date(doctor.last_activity || doctor.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
            </div>
          </div>
        ))}
      </div>

      {doctors.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-500">
          <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucun médecin enregistré</p>
        </div>
      )}
    </div>
  )
}
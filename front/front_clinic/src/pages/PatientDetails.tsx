// pages/PatientDetails.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { patientApi } from '../services/api'
import type { Patient } from '../types'
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function PatientDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (id) loadPatient()
  }, [id])

  const loadPatient = async () => {
    try {
      const data = await patientApi.getById(id!)
      setPatient(data)
    } catch (error) {
      console.error('Erreur chargement patient:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="w-5 h-5 text-yellow-600" />
      case 'in_progress': return <CheckCircle className="w-5 h-5 text-blue-600" />
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'cancelled': return <XCircle className="w-5 h-5 text-gray-600" />
      default: return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Patient non trouvé</h2>
        <button 
          onClick={() => navigate('/patients')}
          className="mt-4 btn-primary"
        >
          Retour à la liste
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {patient.first_name} {patient.last_name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {getStatusIcon(patient.status)}
            <span className="text-sm text-gray-500 capitalize">{patient.status}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informations */}
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Informations</h3>
          
          <div className="space-y-3">
            {patient.date_of_birth && (
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Né(e) le {format(new Date(patient.date_of_birth), 'dd MMMM yyyy', { locale: fr })}</span>
              </div>
            )}
            
            {patient.phone && (
              <a 
                href={`tel:${patient.phone}`}
                className="flex items-center gap-3 text-primary-600 hover:underline"
              >
                <Phone className="w-4 h-4" />
                {patient.phone}
              </a>
            )}
            
            {patient.email && (
              <a 
                href={`mailto:${patient.email}`}
                className="flex items-center gap-3 text-primary-600 hover:underline"
              >
                <Mail className="w-4 h-4" />
                {patient.email}
              </a>
            )}
          </div>
        </div>

        {/* Consultation */}
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Consultation</h3>
          
          <div>
            <label className="text-sm text-gray-500">Motif</label>
            <p className="mt-1 text-gray-900">{patient.reason}</p>
          </div>

          <div>
            <label className="text-sm text-gray-500">Priorité</label>
            <div className="mt-1 flex items-center gap-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                patient.priority === 1 ? 'bg-red-500' :
                patient.priority === 2 ? 'bg-orange-500' :
                patient.priority === 3 ? 'bg-yellow-500' :
                patient.priority === 4 ? 'bg-blue-500' : 'bg-gray-500'
              }`}>
                {patient.priority}
              </span>
              <span className="text-gray-600">
                {patient.priority === 1 ? 'Urgence vitale' :
                 patient.priority === 2 ? 'Urgent' :
                 patient.priority === 3 ? 'Normal' :
                 patient.priority === 4 ? 'Non urgent' : 'Routine'}
              </span>
            </div>
          </div>

          {patient.notes && (
            <div>
              <label className="text-sm text-gray-500">Notes</label>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{patient.notes}</p>
            </div>
          )}
        </div>

        {/* Historique */}
        <div className="card md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Arrivée:</span>
              <span>{format(new Date(patient.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
            </div>
            
            {patient.called_at && (
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">Appelé:</span>
                <span>{format(new Date(patient.called_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
              </div>
            )}
            
            {patient.completed_at && (
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">Terminé:</span>
                <span>{format(new Date(patient.completed_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
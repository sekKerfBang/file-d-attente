import { useEffect, useState } from 'react'
import { useQueueStore } from '../../store/queueStore'
import { useAuth } from '../../hooks/useAuth'
import { doctorApi, patientApi } from '../../services/api'
import { Link } from 'react-router-dom'
import { 
  Ticket, 
  Clock, 
  User, 
  Calendar,
  ArrowRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

export default function PatientDashboard() {
  const { user } = useAuth()
  const { patients, setPatients, waitingPatients } = useQueueStore()
  const [myTicket, setMyTicket] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Cherche le ticket du patient connecté
  useEffect(() => {
    const loadMyTicket = async () => {
      try {
        const allPatients = await patientApi.getAll()
        setPatients(allPatients)
        
        // Trouve le ticket du patient actuel (par email ou user_id)
        const myCurrentTicket = allPatients.find(
          (p: any) => p.email === user?.email && ['waiting', 'in_progress'].includes(p.status)
        )
        
        setMyTicket(myCurrentTicket || null)
      } catch (error) {
        console.error('Erreur chargement ticket:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMyTicket()
    const interval = setInterval(loadMyTicket, 10000) // Refresh toutes les 10s
    return () => clearInterval(interval)
  }, [user, setPatients])

  const waiting = waitingPatients()
  const myPosition = myTicket ? waiting.findIndex((p: any) => p.id === myTicket.id) + 1 : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bienvenue, {user?.first_name}</h2>
          <p className="text-gray-500">Gérez vos consultations médicales</p>
        </div>
      </div>

      {/* Si le patient a déjà un ticket actif */}
      {myTicket ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Carte statut */}
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Votre numéro</p>
                <p className="text-4xl font-bold text-blue-900 mt-2">#{myTicket.id.slice(-4)}</p>
                <p className="text-sm text-blue-700 mt-1">
                  {myTicket.status === 'in_progress' 
                    ? '🩺 C\'est votre tour !' 
                    : `Position: ${myPosition || '?'}/${waiting.length}`}
                </p>
              </div>
              <Ticket className="w-12 h-12 text-blue-600" />
            </div>
            
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Clock className="w-4 h-4" />
                <span>Estimation: {myTicket.estimated_wait_time || '--'} min</span>
              </div>
            </div>
          </div>

          {/* Carte médecin */}
          {myTicket.assigned_doctor && (
            <div className="card bg-green-50 border-green-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Médecin assigné</p>
                  <p className="text-lg font-semibold text-green-900 mt-1">
                    Dr. {myTicket.assigned_doctor_name || 'En attente'}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {myTicket.status === 'in_progress' 
                      ? 'Vous êtes en consultation' 
                      : 'Le médecin vous appellera bientôt'}
                  </p>
                </div>
                <User className="w-12 h-12 text-green-600" />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Si pas de ticket - Invitation à réserver */
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-primary-900">Aucune consultation en cours</h3>
              <p className="text-primary-700 mt-1">Prenez un ticket pour consulter un médecin</p>
            </div>
            <Link
              to="/reserve"
              className="btn-primary flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Réserver maintenant
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* File d'attente actuelle */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">File d'attente en cours</h3>
        {waiting.length > 0 ? (
          <div className="space-y-2">
            {waiting.slice(0, 5).map((patient: any, index: number) => (
              <div 
                key={patient.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  patient.id === myTicket?.id 
                    ? 'bg-primary-50 border border-primary-200' 
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index === 0 ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">
                      {patient.first_name} {patient.last_name}
                      {patient.id === myTicket?.id && <span className="ml-2 text-xs text-primary-600">(Vous)</span>}
                    </p>
                    <p className="text-sm text-gray-500">Priorité: {patient.priority}</p>
                  </div>
                </div>
                {patient.status === 'in_progress' ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                    En consultation
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">
                    ~{patient.estimated_wait_time || '--'} min
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Aucun patient en attente</p>
          </div>
        )}
      </div>
    </div>
  )
}
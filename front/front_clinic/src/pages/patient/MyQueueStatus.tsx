import { useEffect, useState } from 'react'
import { useQueueStore } from '../../store/queueStore'
import { useAuth } from '../../hooks/useAuth'
import { patientApi } from '../../services/api'
import { 
  Bell, 
  Clock, 
  User, 
  MapPin,
  AlertCircle,
  CheckCircle2,
  Hourglass
} from 'lucide-react'

export default function MyQueueStatus() {
  const { user } = useAuth()
  const { patients, setPatients, waitingPatients } = useQueueStore()
  const [myTicket, setMyTicket] = useState<any>(null)
  const [notifications, setNotifications] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Cherche le ticket du patient et écoute les notifications
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const allPatients = await patientApi.getAll()
        setPatients(allPatients)
        
        // Trouve le ticket actif du patient
        const ticket = allPatients.find(
          (p: any) => p.email === user?.email && ['waiting', 'in_progress'].includes(p.status)
        )
        
        setMyTicket(ticket || null)

        // Simule une notification si le statut change (à remplacer par WebSocket)
        if (ticket?.status === 'in_progress' && !notifications.includes('called')) {
          setNotifications(prev => [...prev, 'called'])
          // Ici vous intégrerez les vraies notifications push/WebSocket
        }
        
      } catch (error) {
        console.error('Erreur chargement statut:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStatus()
    const interval = setInterval(loadStatus, 5000) // Refresh rapide pour les notifications
    return () => clearInterval(interval)
  }, [user, setPatients, notifications])

  const waiting = waitingPatients()
  const myPosition = myTicket ? waiting.findIndex((p: any) => p.id === myTicket.id) + 1 : null
  const estimatedWait = myPosition ? myPosition * 15 : 0 // 15 min par patient en moyenne

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!myTicket) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Aucun ticket actif</h3>
        <p className="text-gray-500 mt-2">Vous n'avez pas de consultation en cours.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Mon statut en temps réel</h2>

      {/* Carte principale statut */}
      <div className={`card ${
        myTicket.status === 'in_progress' 
          ? 'bg-green-50 border-green-200' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-75">
              {myTicket.status === 'in_progress' ? 'Statut actuel' : 'Votre position'}
            </p>
            
            {myTicket.status === 'in_progress' ? (
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <span className="text-2xl font-bold text-green-900">C'est votre tour !</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 mt-1">
                <span className="text-4xl font-bold text-blue-900">#{myPosition}</span>
                <span className="text-blue-700">/ {waiting.length} en attente</span>
              </div>
            )}
          </div>
          
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            myTicket.status === 'in_progress' ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            {myTicket.status === 'in_progress' ? (
              <User className="w-8 h-8 text-green-600" />
            ) : (
              <Hourglass className="w-8 h-8 text-blue-600" />
            )}
          </div>
        </div>

        {/* Barre de progression */}
        {myTicket.status === 'waiting' && (
          <div className="mt-4">
            <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${Math.max(5, 100 - (myPosition || 0) * 10)}%` }}
              />
            </div>
            <p className="text-sm text-blue-700 mt-2 text-center">
              {myPosition === 1 ? 'Vous êtes le prochain !' : `${myPosition - 1} personne(s) avant vous`}
            </p>
          </div>
        )}
      </div>

      {/* Temps estimé */}
      {myTicket.status === 'waiting' && (
        <div className="card flex items-center gap-4">
          <Clock className="w-8 h-8 text-orange-500" />
          <div>
            <p className="text-sm text-gray-600">Temps d'attente estimé</p>
            <p className="text-xl font-semibold text-gray-900">
              {estimatedWait} minutes
            </p>
            <p className="text-xs text-gray-500">
              Mise à jour en temps réel
            </p>
          </div>
        </div>
      )}

      {/* Informations consultation */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-gray-900">Détails de la consultation</h3>
        
        <div className="flex items-center gap-3 text-gray-600">
          <User className="w-5 h-5" />
          <span>Dr. {myTicket.assigned_doctor_name || 'Non assigné'}</span>
        </div>
        
        <div className="flex items-center gap-3 text-gray-600">
          <MapPin className="w-5 h-5" />
          <span>Salle {myTicket.room_number || '--'}</span>
        </div>
        
        <div className="flex items-center gap-3 text-gray-600">
          <Clock className="w-5 h-5" />
          <span>Ticket pris à {new Date(myTicket.created_at).toLocaleTimeString('fr-FR')}</span>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <Bell className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-900">Notifications</p>
              {notifications.includes('called') && (
                <p className="text-sm text-yellow-800 mt-1">
                  🔊 Le médecin vous appelle ! Présentez-vous à la salle de consultation.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-primary-600">1.</span>
            Restez dans les environs de la clinique
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600">2.</span>
            Activez les notifications pour être alerté
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600">3.</span>
            Présentez-vous dès que votre numéro est appelé
          </li>
        </ul>
      </div>
    </div>
  )
}
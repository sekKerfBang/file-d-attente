import { Patient } from '../types'
import { Clock, AlertCircle } from 'lucide-react'

interface PatientListProps {
  patients: Patient[]
  compact?: boolean
  onCancel?: (id: string) => void
}

export default function PatientList({ patients, compact, onCancel }: PatientListProps) {
  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1: return <span className="badge-urgent flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Urgence</span>
      case 2: return <span className="badge-priority">Prioritaire</span>
      case 3: return <span className="badge-normal">Normal</span>
      case 4: return <span className="badge-low">Non urgent</span>
      default: return null
    }
  }

  if (patients.length === 0) {
    return (
      <div className="card text-center py-8 text-gray-500">
        Aucun patient en attente
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {patients.map((patient, index) => (
        <div 
          key={patient.id} 
          className={`card ${index === 0 ? 'border-2 border-primary-500 bg-primary-50' : ''} ${
            patient.priority === 1 ? 'border-l-4 border-l-red-500' : ''
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                index === 0 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {index + 1}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-lg text-gray-900">
                    {patient.ticket_number}
                  </span>
                  {getPriorityBadge(patient.priority)}
                </div>
                <p className="font-medium text-gray-900">
                  {patient.first_name} {patient.last_name}
                </p>
                {!compact && (
                  <p className="text-sm text-gray-500 mt-1">
                    {patient.notes || 'Aucune note'}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                <span>{patient.wait_time_minutes} min</span>
              </div>
              {patient.estimated_wait_time > 0 && (
                <p className="text-xs text-gray-400">
                  ~{patient.estimated_wait_time} min d'attente
                </p>
              )}
            </div>
          </div>

          {onCancel && patient.status === 'waiting' && (
            <button
              onClick={() => onCancel(patient.id)}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
            >
              Annuler ce patient
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
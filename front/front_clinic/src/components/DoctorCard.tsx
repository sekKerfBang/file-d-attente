import { Doctor } from '../types'
import { User, MapPin, Phone } from 'lucide-react'

interface DoctorCardProps {
  doctor: Doctor
  onCallNext?: (id: string) => void
  onFinish?: (id: string) => void
}

export default function DoctorCard({ doctor, onCallNext, onFinish }: DoctorCardProps) {
  const specialtyLabels: Record<string, string> = {
    general: 'Médecine Générale',
    cardio: 'Cardiologie',
    derma: 'Dermatologie',
    pedia: 'Pédiatrie',
    ortho: 'Orthopédie',
  }

  return (
    <div className="card border-l-4 border-l-primary-500">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-semibold text-lg text-gray-900">
            Dr. {doctor.first_name} {doctor.last_name}
          </h4>
          <p className="text-sm text-gray-500">{specialtyLabels[doctor.specialty]}</p>
        </div>
        <span className="badge bg-gray-100 text-gray-700 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {doctor.room_number}
        </span>
      </div>

      {doctor.current_patient_details ? (
        <div className="bg-green-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">
            Patient actuel
          </p>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-green-900">
                {doctor.current_patient_details.ticket_number}
              </p>
              <p className="text-sm text-green-700">
                {doctor.current_patient_details.name}
              </p>
            </div>
            <span className={`badge ${
              doctor.current_patient_details.priority === 1 ? 'bg-red-100 text-red-800' :
              doctor.current_patient_details.priority === 2 ? 'bg-orange-100 text-orange-800' :
              'bg-green-100 text-green-800'
            }`}>
              P{doctor.current_patient_details.priority}
            </span>
          </div>
          {onFinish && (
            <button
              onClick={() => onFinish(doctor.id)}
              className="mt-3 w-full btn-primary text-sm py-1"
            >
              Terminer la consultation
            </button>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-center">
          <p className="text-gray-500 text-sm">Aucun patient en cours</p>
          {onCallNext && (
            <button
              onClick={() => onCallNext(doctor.id)}
              className="mt-2 btn-primary text-sm py-1 w-full"
            >
              Appeler le suivant
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <User className="w-4 h-4" />
        <span>En service</span>
      </div>
    </div>
  )
}
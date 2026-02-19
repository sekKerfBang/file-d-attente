import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { patientApi } from '../services/api'
import type { Patient } from '../types'
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  Phone,
  Mail,
  Calendar,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Patients() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const loadPatients = useCallback(async () => {
    try {
      const data = await patientApi.getAll()
      setPatients(data)
    } catch (error) {
      console.error('Erreur chargement patients:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPatients()
  }, [loadPatients])

  const filteredPatients = patients.filter(p => {
    const matchesSearch = 
      p.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery)
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      waiting: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    const labels = {
      waiting: 'En attente',
      in_progress: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getPriorityBadge = (priority: number) => {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-gray-500']
    return (
      <span className={`w-6 h-6 rounded-full ${colors[priority - 1]} text-white text-xs flex items-center justify-center font-bold`}>
        {priority}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patients</h2>
          <p className="text-sm text-gray-500">{patients.length} patients au total</p>
        </div>
        <button
          onClick={() => navigate('/patients/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau patient
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="all">Tous les statuts</option>
          <option value="waiting">En attente</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminés</option>
          <option value="cancelled">Annulés</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priorité</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrivée</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Aucun patient trouvé
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{patient.reason}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        {patient.phone && (
                          <a href={`tel:${patient.phone}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                            <Phone className="w-3 h-3" />
                            {patient.phone}
                          </a>
                        )}
                        {patient.email && (
                          <a href={`mailto:${patient.email}`} className="flex items-center gap-1 text-gray-600 hover:underline">
                            <Mail className="w-3 h-3" />
                            {patient.email}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getPriorityBadge(patient.priority)}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(patient.status)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(patient.created_at), 'HH:mm', { locale: fr })}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(patient.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button 
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        Détails →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
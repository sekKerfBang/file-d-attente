import { useEffect, useCallback } from 'react'
import { useQueueStore } from '../store/queueStore'
import { doctorApi, patientApi, statsApi } from '../services/api'
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Activity,
  RefreshCw
} from 'lucide-react'
import DoctorCard from '../components/DoctorCard'
import PatientList from '../components/PatientList'

export default function Dashboard() {
  const { 
    doctors, 
    patients, 
    stats, 
    setDoctors, 
    setPatients, 
    setStats,
    setLoading,
    setError,
    isLoading,
    error,
    waitingPatients,
    urgentPatients,
    activeDoctors,
    inProgressPatients
  } = useQueueStore()

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Chargement dashboard...')
      
      const [doctorsData, patientsData, statsData] = await Promise.all([
        doctorApi.getAll(),      // Retourne déjà un tableau grâce à extractResults
        patientApi.getAll({ status: 'waiting' }),  // Idem
        statsApi.getStats()
      ])
      
      console.log('✅ Données reçues:', {
        doctors: doctorsData.length,
        patients: patientsData.length,
        stats: statsData
      })
      
      setDoctors(doctorsData)
      setPatients(patientsData)
      setStats(statsData)
      
    } catch (err: any) {
      console.error('❌ Erreur:', err)
      setError(err.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [setDoctors, setPatients, setStats, setLoading, setError])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  const waiting = waitingPatients()
  const urgent = urgentPatients()
  const active = activeDoctors()
  const inProgress = inProgressPatients()

  if (isLoading && doctors.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error && doctors.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200 max-w-md w-full">
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="En attente" value={stats?.total_waiting ?? waiting.length} icon={Users} color="blue" />
        <StatCard title="Urgences" value={stats?.urgent_count ?? urgent.length} icon={AlertCircle} color="orange" />
        <StatCard title="En consultation" value={stats?.total_in_progress ?? inProgress.length} icon={Activity} color="green" />
        <StatCard title="Terminés" value={stats?.total_completed_today ?? 0} icon={CheckCircle} color="purple" />
      </div>

      {/* Temps d'attente */}
      {(stats?.average_wait_time ?? 0) > 0 && (
        <div className="card bg-yellow-50 border-yellow-200 flex items-center gap-4">
          <Clock className="w-6 h-6 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Temps d'attente moyen</p>
            <p className="text-lg font-semibold text-yellow-900">{Math.round(stats?.average_wait_time || 0)} min</p>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Médecins */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold">Médecins en service ({active.length})</h3>
          {active.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {active.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucun médecin actif</p>
            </div>
          )}
        </div>

        {/* Patients */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">File d'attente ({waiting.length})</h3>
          {waiting.length > 0 ? (
            <PatientList patients={waiting.slice(0, 5)} compact showPriority />
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucun patient en attente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: {
  title: string
  value: number
  icon: React.ElementType
  color: 'blue' | 'orange' | 'green' | 'purple'
}) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  }

  return (
    <div className={`card ${colors[color]} border`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="w-8 h-8 opacity-80" />
      </div>
    </div>
  )
}
import { useEffect, useState, useCallback } from 'react'
import { statsApi, patientApi } from '../services/api'
import type { QueueStats, Patient } from '../services/api'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts'
import { Download, Calendar, AlertCircle, RefreshCw } from 'lucide-react'

interface HourlyData {
  hour: string
  waiting: number
  in_progress: number
  completed: number
}

type DateRange = 'today' | 'week' | 'month'

export default function Statistics() {
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [history, setHistory] = useState<HourlyData[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [dateRange, setDateRange] = useState<DateRange>('today')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [statsData, patientsData] = await Promise.all([
        statsApi.getStats(),
        patientApi.getAll()
      ])
      
      setStats(statsData)
      setPatients(patientsData)
      
      // Calcul des données horaires
      const hourlyStats = calculateHourlyStats(patientsData)
      setHistory(hourlyStats)
      
    } catch (err: any) {
      console.error('Erreur stats:', err)
      setError(err.message || 'Erreur de chargement des statistiques')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 60000)
    return () => clearInterval(interval)
  }, [loadStats])

  const calculateHourlyStats = (patients: Patient[]): HourlyData[] => {
    const hours = ['8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h']
    
    return hours.map(hour => {
      const hourNum = parseInt(hour)
      // Simulation - remplacez par vos vraies données basées sur les timestamps
      return {
        hour,
        waiting: patients.filter(p => {
          const created = new Date(p.created_at).getHours()
          return created === hourNum && p.status === 'waiting'
        }).length || Math.floor(Math.random() * 5),
        in_progress: Math.floor(Math.random() * 3),
        completed: Math.floor(Math.random() * 5)
      }
    })
  }

  const priorityData = [
    { name: 'Urgence (1)', value: stats?.urgent_count || 0, color: '#dc2626' },
    { 
      name: 'Prioritaire (2)', 
      value: patients.filter(p => p.priority === 2 && p.status === 'waiting').length, 
      color: '#f59e0b' 
    },
    { 
      name: 'Normal (3)', 
      value: patients.filter(p => p.priority === 3 && p.status === 'waiting').length, 
      color: '#16a34a' 
    },
    { 
      name: 'Non urgent (4+)', 
      value: patients.filter(p => p.priority >= 4 && p.status === 'waiting').length, 
      color: '#6b7280' 
    }
  ].filter(d => d.value > 0)

  const doctorPerformance = stats?.doctor_stats?.map((doc) => ({
    name: doc.name,
    patients: doc.patients_seen_today,
    avgTime: Math.round(doc.average_consultation_time)
  })) || []

  const exportData = () => {
    const data = {
      date: new Date().toISOString(),
      range: dateRange,
      stats,
      patients: patients.length
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stats-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-700">{error}</p>
          <button onClick={loadStats} className="btn-primary mt-4 flex items-center gap-2 mx-auto">
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return <div>Aucune donnée disponible</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Statistiques</h2>
          <p className="text-sm text-gray-500">Analyse de l'activité</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
          <button
            onClick={exportData}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="En attente" value={stats.total_waiting} color="blue" />
        <KpiCard label="En consultation" value={stats.total_in_progress} color="green" />
        <KpiCard label="Terminés" value={stats.total_completed_today} color="purple" />
        <KpiCard 
          label="Temps moyen" 
          value={`${Math.round(stats.average_wait_time)}min`} 
          color="orange" 
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activité horaire */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Activité par heure</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="waiting" name="En attente" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="in_progress" name="En cours" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Terminés" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition priorités */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Répartition par priorité</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance médecins */}
        {doctorPerformance.length > 0 && (
          <div className="card lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Performance des médecins</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doctorPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="patients" name="Patients vus" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="avgTime" name="Temps moyen (min)" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Composant helper KPI
function KpiCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
  }

  return (
    <div className={`card ${colors[color]} border`}>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { patientApi } from '../services/api'
import { useQueueStore } from '../store/queueStore'
import { UserPlus, ArrowLeft, AlertCircle } from 'lucide-react'

interface FormData {
  first_name: string
  last_name: string
  date_of_birth: string
  phone: string
  email: string
  reason: string
  priority: number
  notes: string
}

const initialFormData: FormData = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  phone: '',
  email: '',
  reason: '',
  priority: 3,
  notes: ''
}

const priorityOptions = [
  { value: 1, label: 'Urgence vitale', color: 'bg-red-100 text-red-700 border-red-300', desc: 'Moins de 15 minutes' },
  { value: 2, label: 'Urgent', color: 'bg-orange-100 text-orange-700 border-orange-300', desc: '15-30 minutes' },
  { value: 3, label: 'Normal', color: 'bg-green-100 text-green-700 border-green-300', desc: '30-60 minutes' },
  { value: 4, label: 'Non urgent', color: 'bg-blue-100 text-blue-700 border-blue-300', desc: '1-2 heures' },
  { value: 5, label: 'Routine', color: 'bg-gray-100 text-gray-700 border-gray-300', desc: 'Plus de 2 heures' }
]

export default function PatientRegistration() {
  const navigate = useNavigate()
  const { addPatient } = useQueueStore()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    
    if (!formData.first_name.trim()) newErrors.first_name = 'Prénom requis'
    if (!formData.last_name.trim()) newErrors.last_name = 'Nom requis'
    if (!formData.reason.trim()) newErrors.reason = 'Motif de consultation requis'
    
    // Validation téléphone (format français)
    if (formData.phone && !/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(formData.phone)) {
      newErrors.phone = 'Numéro de téléphone invalide'
    }
    
    // Validation email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      const newPatient = await patientApi.create({
        ...formData,
        status: 'waiting',
        created_at: new Date().toISOString()
      })
      
      addPatient(newPatient)
      
      // Notification succès
      alert(`Patient ${newPatient.first_name} ${newPatient.last_name} enregistré avec succès !`)
      
      // Redirection vers la file d'attente
      navigate('/queue')
      
    } catch (error: any) {
      console.error('Erreur création patient:', error)
      alert(error.response?.data?.detail || 'Erreur lors de l\'enregistrement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nouveau patient</h2>
          <p className="text-sm text-gray-500">Enregistrer un patient dans la file d'attente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations personnelles */}
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Informations personnelles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className={`input ${errors.first_name ? 'border-red-500' : ''}`}
                placeholder="Jean"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className={`input ${errors.last_name ? 'border-red-500' : ''}`}
                placeholder="Dupont"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de naissance
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`input ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="06 12 34 56 78"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="jean.dupont@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Consultation */}
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Consultation</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motif de consultation *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              rows={3}
              className={`input ${errors.reason ? 'border-red-500' : ''}`}
              placeholder="Décrivez les symptômes ou le motif de la visite..."
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Niveau de priorité
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('priority', option.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.priority === option.value
                      ? `${option.color} border-current ring-2 ring-offset-1`
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-sm">{option.label}</div>
                  <div className="text-xs opacity-75 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes complémentaires
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              className="input"
              placeholder="Allergies, antécédents, etc. (optionnel)"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/queue')}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Enregistrer le patient
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}




// import PatientForm from '../components/PatientForm'

// export default function PatientRegistration() {
//   return (
//     <div className="max-w-2xl mx-auto">
//       <h2 className="text-2xl font-bold text-gray-900 mb-6">
//         Nouveau patient
//       </h2>
//       <PatientForm onSuccess={() => {
//         // Optionnel: redirection ou message
//       }} />
//     </div>
//   )
// }
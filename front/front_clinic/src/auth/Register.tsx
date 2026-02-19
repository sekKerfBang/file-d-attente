// pages/Register.tsx
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../services/api'
import { 
  Stethoscope, 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  UserPlus,
  Stethoscope as DoctorIcon,
  Sparkles
} from 'lucide-react'

type UserRole = 'patient' | 'doctor'

interface FormData {
  username: string
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
  role: UserRole
  phone: string
  date_of_birth: string
  specialty: string
}

const initialFormData: FormData = {
  username: '',
  email: '',
  password: '',
  password_confirm: '',
  first_name: '',
  last_name: '',
  role: 'patient',
  phone: '',
  date_of_birth: '',
  specialty: ''
}

export default function Register() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // === REDIRECTION SI DÉJÀ CONNECTÉ ===
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const validateForm = (): boolean => {
    if (formData.password !== formData.password_confirm) {
      setError('Les mots de passe ne correspondent pas')
      return false
    }
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return false
    }
    if (!formData.email.includes('@')) {
      setError('Veuillez entrer une adresse email valide')
      return false
    }
    if (formData.role === 'doctor' && !formData.specialty.trim()) {
      setError('Veuillez indiquer votre spécialité')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const submitData: any = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        phone: formData.phone,
      }

      if (formData.role === 'patient') {
        submitData.date_of_birth = formData.date_of_birth
      } else if (formData.role === 'doctor') {
        submitData.specialty = formData.specialty
      }

      await authApi.register(submitData)
      
      setSuccessMessage('Compte créé avec succès ! Redirection vers la connexion...')
      setTimeout(() => navigate('/login'), 1800)
      
    } catch (err: any) {
      console.error('Erreur inscription:', err)
      
      if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else if (err.response?.data?.username) {
        setError("Ce nom d'utilisateur existe déjà")
      } else if (err.response?.data?.email) {
        setError('Cette adresse email est déjà utilisée')
      } else if (typeof err.response?.data === 'object') {
        const errors = Object.entries(err.response.data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('; ')
        setError(errors)
      } else if (err.code === 'ERR_NETWORK') {
        setError('Impossible de contacter le serveur')
      } else {
        setError('Erreur lors de l\'inscription. Veuillez réessayer.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-3 shadow-lg shadow-primary-500/30 animate-pulse">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
          <p className="text-gray-500 mt-1">Rejoignez MediQueue dès maintenant</p>
        </div>

        {/* Form Card */}
        <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-6 transition-all duration-300 ${isLoading ? 'opacity-75' : 'opacity-100'}`}>
          
          {/* Back link */}
          <Link 
            to="/login" 
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>

          {/* Alertes */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 text-green-700 text-sm animate-in slide-in-from-top-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Sélection du rôle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => !isLoading && handleChange('role', 'patient')}
                disabled={isLoading}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
                  formData.role === 'patient'
                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md transform scale-[1.02]'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:shadow-sm'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]'}`}
              >
                <UserPlus className={`w-6 h-6 ${formData.role === 'patient' ? 'animate-bounce' : ''}`} />
                <span className="text-sm font-medium">Patient</span>
              </button>
              
              <button
                type="button"
                onClick={() => !isLoading && handleChange('role', 'doctor')}
                disabled={isLoading}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
                  formData.role === 'doctor'
                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md transform scale-[1.02]'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:shadow-sm'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]'}`}
              >
                <DoctorIcon className={`w-6 h-6 ${formData.role === 'doctor' ? 'animate-bounce' : ''}`} />
                <span className="text-sm font-medium">Médecin</span>
              </button>
            </div>

            {/* Nom complet */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:opacity-50 disabled:bg-gray-100"
                  placeholder="Jean"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:opacity-50 disabled:bg-gray-100"
                  placeholder="Dupont"
                  required
                />
              </div>
            </div>

            {/* Identifiants + Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:opacity-50 disabled:bg-gray-100"
                  placeholder="jean.dupont"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:opacity-50 disabled:bg-gray-100"
                  placeholder="jean@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:opacity-50 disabled:bg-gray-100"
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>

            {/* Champs conditionnels */}
            {formData.role === 'patient' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:opacity-50 disabled:bg-gray-100"
                  />
                </div>
              </div>
            )}

            {formData.role === 'doctor' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité *</label>
                <div className="relative">
                  <DoctorIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => handleChange('specialty', e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:opacity-50 disabled:bg-gray-100"
                    placeholder="Cardiologie, Pédiatrie..."
                    required
                  />
                </div>
              </div>
            )}

            {/* Mots de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:opacity-50 disabled:bg-gray-100"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.password_confirm}
                  onChange={(e) => handleChange('password_confirm', e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:opacity-50 disabled:bg-gray-100"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full font-semibold py-2.5 rounded-lg transition-all duration-300
                flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 
                ${isLoading 
                  ? 'bg-primary-400 cursor-not-allowed opacity-80' 
                  : 'bg-primary-600 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]'
                }
                text-white mt-6 relative overflow-hidden
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="animate-pulse">Création en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span>Créer mon compte</span>
                </>
              )}
              {!isLoading && (
                <span className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300" />
              )}
            </button>
          </form>

          {/* Lien connexion */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Déjà inscrit ?{' '}
              <Link 
                to="/login" 
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          © 2024 MediQueue. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
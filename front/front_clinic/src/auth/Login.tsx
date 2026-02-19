// pages/Login.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../services/api'
import { 
  Stethoscope, 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  AlertCircle,
  CheckCircle,
  Loader2,
  UserPlus
} from 'lucide-react'

interface LocationState {
  from?: string
  session?: string
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState
  const { setTokens, setUser, isAuthenticated } = useAuthStore()
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: localStorage.getItem('rememberMe') === 'true'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Redirige si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
    
    if (state?.session === 'expired') {
      setError('Votre session a expiré. Veuillez vous reconnecter.')
    }
  }, [isAuthenticated, navigate, state])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsLoading(true)

    try {
      // 1. Login - obtient les tokens
      const loginResponse = await authApi.login({
        username: formData.username,
        password: formData.password
      })

      const { access, refresh } = loginResponse.data
      
      // 2. Gère "Se souvenir de moi"
      if (formData.rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('rememberMe')
      }
      
      // 3. Stocke les tokens
      setTokens(access, refresh)
      
      // 4. Récupère les infos utilisateur
      const meResponse = await authApi.me()
      setUser(meResponse.data)
      
      setSuccessMessage('Connexion réussie ! Redirection...')
      
      // 5. Redirection
      const redirectTo = state?.from || '/dashboard'
      setTimeout(() => navigate(redirectTo, { replace: true }), 500)
      
    } catch (err: any) {
      console.error('Erreur login:', err)
      console.error('Response:', err.response?.data)
      
      if (err.response?.status === 401) {
        setError(err.response?.data?.detail || 'Identifiants incorrects')
      } else if (err.response?.status === 400) {
        setError('Veuillez vérifier vos identifiants')
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else if (err.code === 'ERR_NETWORK') {
        setError('Impossible de contacter le serveur. Vérifiez votre connexion.')
      } else {
        setError('Erreur de connexion. Veuillez réessayer.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-500/30">
            <Stethoscope className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MediQueue</h1>
          <p className="text-gray-500 mt-2">Gestion de file d'attente médicale</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Connexion</h2>
            <p className="text-sm text-gray-500 mt-1">Entrez vos identifiants pour accéder à l'application</p>
          </div>

          {/* Alertes */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 text-green-700 animate-in slide-in-from-top-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Identifiant
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="nom.utilisateur"
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">Se souvenir de moi</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Lien d'inscription */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">Vous n'avez pas de compte ?</p>
              <Link 
                to="/register" 
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Créer un compte
              </Link>
            </div>
          </div>

          {/* Demo credentials */}
          {/* <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              <span className="font-semibold">Démonstration :</span><br />
              Admin: admin / admin123<br />
              Médecin: doctor / doctor123
            </p>
          </div> */}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-8">
          © 2024 MediQueue. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}


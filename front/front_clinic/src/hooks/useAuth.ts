import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'

export function useAuth() {
  const navigate = useNavigate()
  const { logout: storeLogout, user, isAuthenticated, refreshToken } = useAuthStore()

  const logoutUser = async () => {
    try {
      // Appel API pour blacklister le token côté serveur
     if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      storeLogout()
      navigate('/login', { replace: true })
    }
  }

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const hasAnyRole = (...roles: string[]): boolean => {
    return roles.some(role => user?.role === role)
  }

  return {
    user,
    isAuthenticated,
    logout: logoutUser,
    hasRole,
    hasAnyRole,
    refreshToken,
    isAdmin: user?.role === 'admin',
    isDoctor: user?.role === 'doctor',
    isSecretary: user?.role === 'secretary',
    isPatient: user?.role === 'patient',
  }
}



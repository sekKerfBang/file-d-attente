import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useEffect, useState, useCallback } from 'react'
import { authApi } from '../services/api'
import { Loader2 } from 'lucide-react'

interface PrivateRouteProps {
  requiredRoles?: string[]
  children?: React.ReactNode
}

export default function PrivateRoute({ requiredRoles, children }: PrivateRouteProps) {
  const { isAuthenticated, user, accessToken, setUser, setAccessToken, logout } = useAuthStore()
  const location = useLocation()
  const [isVerifying, setIsVerifying] = useState(true)
  const [isValid, setIsValid] = useState(false)

  const verifyAuthentication = useCallback(async () => {
    // Si pas de token, pas la peine de vérifier
    if (!accessToken) {
      setIsVerifying(false)
      setIsValid(false)
      return
    }

    try {
      // Vérifie le token
      await authApi.verify(accessToken)
      
      // Récupère l'utilisateur si pas déjà présent
      if (!user) {
        const userResponse = await authApi.me()
        setUser(userResponse.data)
      }
      
      setIsValid(true)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.error('Token invalide, tentative de rafraîchissement...')
      
      const currentRefreshToken = useAuthStore.getState().refreshToken
      
      if (currentRefreshToken) {
        try {
          const refreshResponse = await authApi.refresh(currentRefreshToken)
          setAccessToken(refreshResponse.data.access)
          setIsValid(true)
          
          // Récupère l'utilisateur après rafraîchissement
          if (!user) {
            const userResponse = await authApi.me()
            setUser(userResponse.data)
          }
        } catch (refreshError) {
          console.error('Rafraîchissement échoué:', refreshError)
          logout()
          setIsValid(false)
        }
      } else {
        logout()
        setIsValid(false)
      }
    } finally {
      setIsVerifying(false)
    }
  }, [accessToken, user, setUser, setAccessToken, logout])

  useEffect(() => {
    verifyAuthentication()
  }, [verifyAuthentication])

  // Affiche un loader pendant la vérification
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  // Redirige vers login si non authentifié ou token invalide
  if (!isAuthenticated || !isValid) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Vérifie les rôles requis - AVEC REDIRECTION INTELLIGENTE
  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    // Redirige vers la bonne page selon le rôle au lieu de /unauthorized
    if (user.role === 'patient') {
      return <Navigate to="/my-queue" replace />
    }
    // Pour doctor, secretary, admin
    return <Navigate to="/dashboard" replace />
  }

  // Rendu
  return children ? <>{children}</> : <Outlet />
}



// import { Navigate, useLocation, Outlet } from 'react-router-dom'
// import { useAuthStore } from '../store/authStore'
// import { useEffect, useState, useCallback } from 'react'
// import { authApi } from '../services/api'
// import { Loader2 } from 'lucide-react'

// interface PrivateRouteProps {
//   requiredRoles?: string[]
//   children?: React.ReactNode
// }

// export default function PrivateRoute({ requiredRoles, children }: PrivateRouteProps) {
//   const { isAuthenticated, user, accessToken, setUser, setAccessToken, logout } = useAuthStore()
//   const location = useLocation()
//   const [isVerifying, setIsVerifying] = useState(true)
//   const [isValid, setIsValid] = useState(false)

//   const verifyAuthentication = useCallback(async () => {
//     // Si pas de token, pas la peine de vérifier
//     if (!accessToken) {
//       setIsVerifying(false)
//       setIsValid(false)
//       return
//     }

//     try {
//       // Vérifie le token
//       await authApi.verify(accessToken)
      
//       // Récupère l'utilisateur si pas déjà présent
//       if (!user) {
//         const userResponse = await authApi.me()
//         setUser(userResponse.data)
//       }
      
//       setIsValid(true)
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     } catch (error) {
//       console.error('Token invalide, tentative de rafraîchissement...')
      
//       const currentRefreshToken = useAuthStore.getState().refreshToken
      
//       if (currentRefreshToken) {
//         try {
//           const refreshResponse = await authApi.refresh(currentRefreshToken)
//           setAccessToken(refreshResponse.data.access)
//           setIsValid(true)
          
//           // Récupère l'utilisateur après rafraîchissement
//           if (!user) {
//             const userResponse = await authApi.me()
//             setUser(userResponse.data)
//           }
//         } catch (refreshError) {
//           console.error('Rafraîchissement échoué:', refreshError)
//           logout()
//           setIsValid(false)
//         }
//       } else {
//         logout()
//         setIsValid(false)
//       }
//     } finally {
//       setIsVerifying(false)
//     }
//   }, [accessToken, user, setUser, setAccessToken, logout])

//   useEffect(() => {
//     verifyAuthentication()
//   }, [verifyAuthentication])

//   // Affiche un loader pendant la vérification
//   if (isVerifying) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
//           <p className="text-gray-600">Vérification de l'authentification...</p>
//         </div>
//       </div>
//     )
//   }

//   // Redirige vers login si non authentifié ou token invalide
//   if (!isAuthenticated || !isValid) {
//     return <Navigate to="/login" state={{ from: location.pathname }} replace />
//   }

//   // Vérifie les rôles requis
//   if (requiredRoles && user && !requiredRoles.includes(user.role)) {
//     return <Navigate to="/unauthorized" replace />
//   }

//   // Rendu
//   return children ? <>{children}</> : <Outlet />
// }
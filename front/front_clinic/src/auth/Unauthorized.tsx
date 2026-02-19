// pages/Unauthorized.tsx
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, Home } from 'lucide-react'

export default function Unauthorized() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <ShieldAlert className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">403</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Accès refusé</h2>
        <p className="text-gray-500 mb-6">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Retour
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Tableau de bord
          </button>
        </div>
      </div>
    </div>
  )
}
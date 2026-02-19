// pages/NotFound.tsx
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Home } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Page non trouvée</h2>
        <p className="text-gray-500 mb-6">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Retour au tableau de bord
        </button>
      </div>
    </div>
  )
}
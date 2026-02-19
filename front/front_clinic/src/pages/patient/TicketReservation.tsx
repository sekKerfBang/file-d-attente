import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doctorApi, patientApi } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { Calendar, Clock, User, AlertCircle, CheckCircle } from 'lucide-react'

export default function TicketReservation() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [doctors, setDoctors] = useState<any[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [reason, setReason] = useState('')
  const [priority, setPriority] = useState(3)
  const [dateOfBirth, setDateOfBirth] = useState(''); 
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const docs = await doctorApi.getAll()
        setDoctors(docs.filter((d: any) => d.is_active))
      } catch (err) {
        console.error('Erreur chargement médecins:', err)
      }
    }
    loadDoctors()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // CORRECTION : N'envoyez que les champs que le backend accepte
      // Vérifiez votre serializer Patient pour voir les champs requis
      const patientData = {
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email,
        phone: user?.phone || '',
        priority: priority,
        reason: reason || 'Consultation générale',
        date_of_birth: dateOfBirth,
        // Optionnel : assigned_doctor si sélectionné
          ...(selectedDoctor && { assigned_doctor: selectedDoctor }),
        user: user?.id || user?.pk,
      }

      console.log('📤 Données envoyées:', patientData) // Debug

       const createdPatient = await patientApi.create(patientData)
       console.log('✅ Patient créé avec succès →', createdPatient)

      navigate('/my-queue')
    } catch (err: any) {
      console.error('❌ Erreur création patient:', err.response?.data)
      // Affiche l'erreur détaillée du backend
        const errorMsg = err.response?.data?.date_of_birth?.[0] ||
        err.response?.data?.detail 
        || err.response?.data?.email?.[0]
        || err.response?.data?.first_name?.[0]
        || err.response?.data?.last_name?.[0]
        || err.response?.data?.non_field_errors?.[0]
        || 'Erreur lors de la réservation'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Réserver un ticket</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

          <form onSubmit={handleSubmit} className="space-y-6 card">
               <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de naissance *
                    </label>
                    <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
                        required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choisir un médecin (optionnel)
          </label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Premier disponible</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                Dr. {doc.name} - {doc.specialty}
              </option>
            ))}
          </select>
        </div>

        {/* Urgence */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Niveau d'urgence
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 1, label: 'Urgence', color: 'bg-red-100 text-red-700 border-red-200' },
              { value: 2, label: 'Prioritaire', color: 'bg-orange-100 text-orange-700 border-orange-200' },
              { value: 3, label: 'Normal', color: 'bg-green-100 text-green-700 border-green-200' },
              { value: 4, label: 'Non urgent', color: 'bg-gray-100 text-gray-700 border-gray-200' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  priority === opt.value ? opt.color : 'bg-white hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="block text-xs opacity-75">Niveau {opt.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Motif */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motif de consultation
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
            placeholder="Décrivez brièvement votre motif de consultation..."
            required
          />
        </div>

        {/* Récapitulatif */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Récapitulatif</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {user?.first_name} {user?.last_name}
            </p>
            <p className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Aujourd'hui
            </p>
            <p className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Estimation: {priority === 1 ? '15' : priority === 2 ? '30' : '60'} min
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Confirmer la réservation
            </>
          )}
        </button>
      </form>
    </div>
  )
}



// import { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { doctorApi, patientApi } from '../../services/api'
// import { useAuth } from '../../hooks/useAuth'
// import { Calendar, Clock, User, AlertCircle, CheckCircle } from 'lucide-react'

// export default function TicketReservation() {
//   const navigate = useNavigate()
//   const { user } = useAuth()
//   const [doctors, setDoctors] = useState<any[]>([])
//   const [selectedDoctor, setSelectedDoctor] = useState('')
//   const [reason, setReason] = useState('')
//   const [priority, setPriority] = useState(3)
//   const [isLoading, setIsLoading] = useState(false)
//   const [error, setError] = useState('')

//   useEffect(() => {
//     const loadDoctors = async () => {
//       try {
//         const docs = await doctorApi.getAll()
//         setDoctors(docs.filter((d: any) => d.is_active))
//       } catch (err) {
//         console.error('Erreur chargement médecins:', err)
//       }
//     }
//     loadDoctors()
//   }, [])

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setIsLoading(true)
//     setError('')

//     try {
//       await patientApi.create({
//         first_name: user?.first_name,
//         last_name: user?.last_name,
//         email: user?.email,
//         phone: user?.phone,
//         assigned_doctor: selectedDoctor || undefined,
//         priority,
//         reason,
//         status: 'waiting'
//       })

//       navigate('/my-queue')
//     } catch (err: any) {
//       setError(err.response?.data?.detail || 'Erreur lors de la réservation')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <div className="max-w-2xl mx-auto">
//       <h2 className="text-2xl font-bold text-gray-900 mb-6">Réserver un ticket</h2>

//       {error && (
//         <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
//           <AlertCircle className="w-5 h-5" />
//           {error}
//         </div>
//       )}

//       <form onSubmit={handleSubmit} className="space-y-6 card">
//         {/* Sélection du médecin */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Choisir un médecin (optionnel)
//           </label>
//           <select
//             value={selectedDoctor}
//             onChange={(e) => setSelectedDoctor(e.target.value)}
//             className="w-full border rounded-lg px-4 py-2"
//           >
//             <option value="">Premier disponible</option>
//             {doctors.map((doc) => (
//               <option key={doc.id} value={doc.id}>
//                 Dr. {doc.name} - {doc.specialty}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Urgence */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Niveau d'urgence
//           </label>
//           <div className="grid grid-cols-2 gap-3">
//             {[
//               { value: 1, label: 'Urgence', color: 'bg-red-100 text-red-700 border-red-200' },
//               { value: 2, label: 'Prioritaire', color: 'bg-orange-100 text-orange-700 border-orange-200' },
//               { value: 3, label: 'Normal', color: 'bg-green-100 text-green-700 border-green-200' },
//               { value: 4, label: 'Non urgent', color: 'bg-gray-100 text-gray-700 border-gray-200' },
//             ].map((opt) => (
//               <button
//                 key={opt.value}
//                 type="button"
//                 onClick={() => setPriority(opt.value)}
//                 className={`p-3 rounded-lg border text-left transition-colors ${
//                   priority === opt.value ? opt.color : 'bg-white hover:bg-gray-50'
//                 }`}
//               >
//                 <span className="font-medium">{opt.label}</span>
//                 <span className="block text-xs opacity-75">Niveau {opt.value}</span>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Motif */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Motif de consultation
//           </label>
//           <textarea
//             value={reason}
//             onChange={(e) => setReason(e.target.value)}
//             rows={3}
//             className="w-full border rounded-lg px-4 py-2"
//             placeholder="Décrivez brièvement votre motif de consultation..."
//           />
//         </div>

//         {/* Récapitulatif */}
//         <div className="bg-gray-50 p-4 rounded-lg">
//           <h4 className="font-medium text-gray-900 mb-2">Récapitulatif</h4>
//           <div className="space-y-1 text-sm text-gray-600">
//             <p className="flex items-center gap-2">
//               <User className="w-4 h-4" />
//               {user?.first_name} {user?.last_name}
//             </p>
//             <p className="flex items-center gap-2">
//               <Calendar className="w-4 h-4" />
//               Aujourd'hui
//             </p>
//             <p className="flex items-center gap-2">
//               <Clock className="w-4 h-4" />
//               Estimation: {priority === 1 ? '15' : priority === 2 ? '30' : '60'} min
//             </p>
//           </div>
//         </div>

//         <button
//           type="submit"
//           disabled={isLoading}
//           className="w-full btn-primary py-3 flex items-center justify-center gap-2"
//         >
//           {isLoading ? (
//             <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
//           ) : (
//             <>
//               <CheckCircle className="w-5 h-5" />
//               Confirmer la réservation
//             </>
//           )}
//         </button>
//       </form>
//     </div>
//   )
// }
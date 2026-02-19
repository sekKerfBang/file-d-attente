import { Link, useLocation, Outlet } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  BarChart3,
  Activity,
  LogOut,
  User,
  Ticket,
  Calendar,
  Bell
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

// Navigation pour le staff
const staffNavItems = [
  { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/queue', label: 'File d\'attente', icon: Users },
  { path: '/stats', label: 'Statistiques', icon: BarChart3 },
]

// Navigation pour le patient
const patientNavItems = [
  { path: '/my-queue', label: 'Ma file d\'attente', icon: Ticket },
  { path: '/reserve', label: 'Réserver', icon: Calendar },
  { path: '/status', label: 'Mon statut', icon: Bell },
]

export default function Layout() {
  const location = useLocation()
  const { logout, user, isPatient, isDoctor, isSecretary, isAdmin } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  // Choisit la navigation selon le rôle
  const navItems = isPatient ? patientNavItems : staffNavItems
  const userRoleLabel = isPatient ? 'Patient' : isDoctor ? 'Médecin' : isSecretary ? 'Secrétaire' : 'Admin'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Activity className="w-8 h-8 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">ClinicQueue</h1>
              {isPatient && <span className="text-sm text-gray-500 ml-2">- Espace Patient</span>}
            </div>
            
            {/* User section */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.first_name || user?.username}</span>
                <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                  {userRoleLabel}
                </span>
              </div>
              
              <div className="h-4 w-px bg-gray-300" />
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                En ligne
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary-50 text-primary-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
            
            {/* Logout dans la sidebar */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-8"
            >
              <LogOut className="w-5 h-5" />
              Déconnexion
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet /> 
          </div>
        </main>
      </div>
    </div>
  )
}




// import { Link, useLocation, useNavigate } from 'react-router-dom'
// import { 
//   LayoutDashboard, 
//   Users, 
//   BarChart3,
//   Activity,
//   LogOut,
//   User
// } from 'lucide-react'
// import { Outlet } from 'react-router-dom'
// import { useAuth } from '../hooks/useAuth'

// const navItems = [
//   { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
//   { path: '/queue', label: 'File d\'attente', icon: Users },
//   { path: '/stats', label: 'Statistiques', icon: BarChart3 },
// ]

// export default function Layout() {
//   const location = useLocation()
//   const navigate = useNavigate()
//   const { logout, user } = useAuth()

//   const handleLogout = async () => {
//     await logout()
//     // La navigation vers /login est déjà faite dans useAuth
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-white shadow-sm border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center gap-2">
//               <Activity className="w-8 h-8 text-primary-600" />
//               <h1 className="text-xl font-bold text-gray-900">ClinicQueue</h1>
//             </div>
            
//             {/* User section */}
//             <div className="flex items-center gap-4">
//               <div className="flex items-center gap-2 text-sm text-gray-600">
//                 <User className="w-4 h-4" />
//                 <span>{user?.first_name || user?.username}</span>
//                 <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
//                   {user?.role_display || user?.role}
//                 </span>
//               </div>
              
//               <div className="h-4 w-px bg-gray-300" />
              
//               <div className="flex items-center gap-2 text-sm text-gray-500">
//                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
//                 En ligne
//               </div>
              
//               <button
//                 onClick={handleLogout}
//                 className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                 title="Déconnexion"
//               >
//                 <LogOut className="w-4 h-4" />
//                 <span className="hidden sm:inline">Déconnexion</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       <div className="flex">
//         {/* Sidebar */}
//         <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)]">
//           <nav className="p-4 space-y-1">
//             {navItems.map((item) => {
//               const Icon = item.icon
//               const isActive = location.pathname.startsWith(item.path)
              
//               return (
//                 <Link
//                   key={item.path}
//                   to={item.path}
//                   className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
//                     isActive 
//                       ? 'bg-primary-50 text-primary-700 font-medium' 
//                       : 'text-gray-600 hover:bg-gray-50'
//                   }`}
//                 >
//                   <Icon className="w-5 h-5" />
//                   {item.label}
//                 </Link>
//               )
//             })}
            
//             {/* Logout dans la sidebar aussi (optionnel) */}
//             <button
//               onClick={handleLogout}
//               className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-8"
//             >
//               <LogOut className="w-5 h-5" />
//               Déconnexion
//             </button>
//           </nav>
//         </aside>

//         {/* Main content */}
//         <main className="flex-1 p-8">
//           <div className="max-w-7xl mx-auto">
//             <Outlet /> 
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }




// import { ReactNode } from 'react'
// import { Link, useLocation } from 'react-router-dom'
// import { 
//   LayoutDashboard, 
//   Users, 
//   UserPlus, 
//   BarChart3,
//   Activity
// } from 'lucide-react'
// import { Outlet } from 'react-router-dom'

// // interface LayoutProps {
// //   children: ReactNode
// // }

// const navItems = [
//   { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
//   { path: '/queue', label: 'File d\'attente', icon: Users },
//   { path: '/stats', label: 'Statistiques', icon: BarChart3 },
// ]

// export default function Layout() {
//   const location = useLocation()

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-white shadow-sm border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center gap-2">
//               <Activity className="w-8 h-8 text-primary-600" />
//               <h1 className="text-xl font-bold text-gray-900">ClinicQueue</h1>
//             </div>
//             <div className="flex items-center gap-4">
//               <div className="flex items-center gap-2 text-sm text-gray-500">
//                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
//                 En ligne
//               </div>
//             </div>
//           </div>
//         </div>
//       </header>

//       <div className="flex">
//         {/* Sidebar */}
//         <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)]">
//           <nav className="p-4 space-y-1">
//             {navItems.map((item) => {
//               const Icon = item.icon
//               const isActive = location.pathname === item.path
              
//               return (
//                 <Link
//                   key={item.path}
//                   to={item.path}
//                   className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
//                     isActive 
//                       ? 'bg-primary-50 text-primary-700 font-medium' 
//                       : 'text-gray-600 hover:bg-gray-50'
//                   }`}
//                 >
//                   <Icon className="w-5 h-5" />
//                   {item.label}
//                 </Link>
//               )
//             })}
//           </nav>
//         </aside>

//         {/* Main content */}
//         <main className="flex-1 p-8">
//           <div className="max-w-7xl mx-auto">
//               <Outlet /> 
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }
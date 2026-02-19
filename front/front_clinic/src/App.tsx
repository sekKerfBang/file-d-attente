import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'

// Auth pages
import { Login, Register } from './auth'

// Staff pages (admin/doctor/secretary)
import Dashboard from './pages/Dashboard'
import QueueManagement from './pages/QueueManagement'
import PatientRegistration from './pages/PatientRegistration'
import Statistics from './pages/Statistics'
import Patients from './pages/Patients'
import PatientDetails from './pages/PatientDetails'
import Doctors from './pages/Doctors'

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard'
import TicketReservation from './pages/patient/TicketReservation'
import MyQueueStatus from './pages/patient/MyQueueStatus'

// Common
import NotFound from './pages/NotFound'
import Unauthorized from './auth/Unauthorized'

function App() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Routes protégées - STAFF (admin/doctor/secretary) */}
      <Route element={<PrivateRoute requiredRoles={['admin', 'doctor', 'secretary']} />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/queue" element={<QueueManagement />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/new" element={<PatientRegistration />} />
          <Route path="/patients/:id" element={<PatientDetails />} />
          <Route path="/stats" element={<Statistics />} />
          <Route path="/doctors" element={<Doctors />} />
        </Route>
      </Route>

      {/* Routes protégées - PATIENT uniquement */}
      <Route element={<PrivateRoute requiredRoles={['patient']} />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/my-queue" replace />} />
          <Route path="/my-queue" element={<PatientDashboard />} />
          <Route path="/reserve" element={<TicketReservation />} />
          <Route path="/status" element={<MyQueueStatus />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App



// import { Routes, Route, Navigate } from 'react-router-dom'
// import PrivateRoute from './components/PrivateRoute'
// import Layout from './components/Layout'

// import { Login, Register } from './auth'
// import Dashboard from './pages/Dashboard'
// import QueueManagement from './pages/QueueManagement'
// import PatientRegistration from './pages/PatientRegistration'
// import Statistics from './pages/Statistics'
// import Patients from './pages/Patients'
// import PatientDetails from './pages/PatientDetails'
// import Doctors from './pages/Doctors'
// import NotFound from './pages/NotFound'
// import Unauthorized from './auth/Unauthorized'

// function App() {
//   return (
//     <Routes>
//       {/* Publiques */}
//       <Route path="/login" element={<Login />} />
//       <Route path="/register" element={<Register />} />
//       <Route path="/unauthorized" element={<Unauthorized />} />

//       {/* Protégées */}
//       <Route element={<PrivateRoute />}>
//         <Route path="/" element={<Layout />}>
//           <Route index element={<Navigate to="dashboard" replace />} />
//           <Route path="dashboard" element={<Dashboard />} />
//           <Route path="queue" element={<QueueManagement />} />
//           <Route path="patients" element={<Patients />} />
//           <Route path="patients/new" element={<PatientRegistration />} />
//           <Route path="patients/:id" element={<PatientDetails />} />
//           <Route path="stats" element={<Statistics />} />
//           <Route path="doctors" element={<Doctors />} />
//         </Route>
//       </Route>

//       <Route path="*" element={<NotFound />} />
//     </Routes>
//   )
// }

// export default App




// import { Routes, Route, Navigate } from 'react-router-dom'
// import PrivateRoute from './components/PrivateRoute'
// import Layout from './components/Layout'

// // Auth pages
// import { Login, Register } from './auth'

// // Other pages
// import Dashboard from './pages/Dashboard'
// import QueueManagement from './pages/QueueManagement'
// import PatientRegistration from './pages/PatientRegistration'
// import Statistics from './pages/Statistics'
// import Patients from './pages/Patients'
// import PatientDetails from './pages/PatientDetails'
// import Doctors from './pages/Doctors'
// import NotFound from './pages/NotFound'
// import Unauthorized from './auth/Unauthorized'

// function App() {
//   return (
//     <Routes>
//       {/* Routes publiques */}
//       <Route path="/login" element={<Login />} />
//       <Route path="/register" element={<Register />} />
//       <Route path="/unauthorized" element={<Unauthorized />} />

//       {/* Routes protégées */}
//       <Route element={<PrivateRoute />}>
//         <Route element={<Layout />}>
//           <Route index element={<Navigate to="/dashboard" replace />} />
//           <Route path="/dashboard" element={<Dashboard />} />
//           <Route path="/queue" element={<QueueManagement />} />
//           <Route path="/patients" element={<Patients />} />
//           <Route path="/patients/new" element={<PatientRegistration />} />
//           <Route path="/patients/:id" element={<PatientDetails />} />
//           <Route path="/stats" element={<Statistics />} />
//           <Route path="/doctors" element={<Doctors />} />
//           <Route path="*" element={<NotFound />} />
//         </Route>
//       </Route>

//       <Route path="*" element={<NotFound />} />
//     </Routes>
//   )
// }

// export default App
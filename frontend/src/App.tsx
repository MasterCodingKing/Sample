import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard'
import Residents from './pages/dashboard/Residents'
import ResidentDetail from './pages/dashboard/ResidentDetail'
import ResidentForm from './pages/dashboard/ResidentForm'
import Households from './pages/dashboard/Households'
import HouseholdForm from './pages/dashboard/HouseholdForm'
import Documents from './pages/dashboard/Documents'
import DocumentForm from './pages/dashboard/DocumentForm'
import Businesses from './pages/dashboard/Businesses'
import BusinessForm from './pages/dashboard/BusinessForm'
import BusinessPermits from './pages/dashboard/BusinessPermits'
import Officials from './pages/dashboard/Officials'
import OfficialForm from './pages/dashboard/OfficialForm'
import Incidents from './pages/dashboard/Incidents'
import IncidentForm from './pages/dashboard/IncidentForm'
import Announcements from './pages/dashboard/Announcements'
import AnnouncementForm from './pages/dashboard/AnnouncementForm'
import Events from './pages/dashboard/Events'
import EventForm from './pages/dashboard/EventForm'
import Reports from './pages/dashboard/Reports'
import Users from './pages/dashboard/Users'
import UserForm from './pages/dashboard/UserForm'
import Settings from './pages/dashboard/Settings'
import Profile from './pages/dashboard/Profile'
import Barangays from './pages/dashboard/Barangays'
import NotFound from './pages/NotFound'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Public Route Component (redirect if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

// Role-based Route Guard Component
function RoleGuard({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode
  allowedRoles: string[] 
}) {
  const { user } = useAuthStore()
  
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">You don't have permission to access this page.</p>
      </div>
    )
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/residents" element={<Residents />} />
        <Route path="/residents/new" element={<ResidentForm />} />
        <Route path="/residents/:id" element={<ResidentDetail />} />
        <Route path="/residents/:id/edit" element={<ResidentForm />} />
        <Route path="/households" element={<Households />} />
        <Route path="/households/new" element={<HouseholdForm />} />
        <Route path="/households/:id" element={<HouseholdForm />} />
        <Route path="/households/:id/edit" element={<HouseholdForm />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/new" element={<DocumentForm />} />
        <Route path="/businesses" element={<Businesses />} />
        <Route path="/businesses/new" element={<BusinessForm />} />
        <Route path="/businesses/:id" element={<BusinessForm />} />
        <Route path="/businesses/:id/edit" element={<BusinessForm />} />
        <Route path="/business-permits" element={<BusinessPermits />} />
        <Route path="/officials" element={<Officials />} />
        <Route path="/officials/new" element={<OfficialForm />} />
        <Route path="/officials/:id" element={<OfficialForm />} />
        <Route path="/officials/:id/edit" element={<OfficialForm />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/incidents/new" element={<IncidentForm />} />
        <Route path="/incidents/:id" element={<IncidentForm />} />
        <Route path="/incidents/:id/edit" element={<IncidentForm />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/announcements/new" element={<AnnouncementForm />} />
        <Route path="/announcements/:id" element={<AnnouncementForm />} />
        <Route path="/announcements/:id/edit" element={<AnnouncementForm />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/new" element={<EventForm />} />
        <Route path="/events/:id" element={<EventForm />} />
        <Route path="/events/:id/edit" element={<EventForm />} />
        <Route path="/reports" element={<Reports />} />
        
        {/* Admin & Super Admin only routes */}
        <Route path="/users" element={<RoleGuard allowedRoles={['admin', 'super_admin']}><Users /></RoleGuard>} />
        <Route path="/users/new" element={<RoleGuard allowedRoles={['admin', 'super_admin']}><UserForm /></RoleGuard>} />
        <Route path="/users/:id" element={<RoleGuard allowedRoles={['admin', 'super_admin']}><UserForm /></RoleGuard>} />
        <Route path="/users/:id/edit" element={<RoleGuard allowedRoles={['admin', 'super_admin']}><UserForm /></RoleGuard>} />
        
        {/* Super Admin only routes */}
        <Route path="/barangays" element={<RoleGuard allowedRoles={['super_admin']}><Barangays /></RoleGuard>} />
        
        {/* Admin & Super Admin Settings */}
        <Route path="/settings" element={<RoleGuard allowedRoles={['admin', 'super_admin']}><Settings /></RoleGuard>} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Redirect root to dashboard or login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App

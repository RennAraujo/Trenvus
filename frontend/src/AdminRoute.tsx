import { Navigate } from 'react-router-dom'
import { useAuth } from './auth'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  if (!auth.isAuthenticated) return <Navigate to="/login" replace />
  if (!auth.isAdmin) return <Navigate to="/app" replace />
  return children
}


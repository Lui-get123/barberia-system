import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import type { UserRole } from '@/lib/types'

export function RequireAuth({ roles, children }: { roles?: UserRole[]; children: ReactNode }) {
  const { user, initialized } = useAuth()
  const location = useLocation()

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={defaultRoute(user.role)} replace />
  return <>{children}</>
}

export function defaultRoute(role: UserRole) {
  if (role === 'admin') return '/dashboard'
  if (role === 'barber') return '/agenda'
  return '/book'
}

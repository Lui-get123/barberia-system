export type UserRole = 'admin' | 'barber' | 'client'

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface User {
  id: number
  email: string
  full_name: string
  phone?: string | null
  role: UserRole
  is_active: boolean
  avatar_url?: string | null
  bio?: string | null
  specialty?: string | null
  created_at: string
}

export interface Service {
  id: number
  name: string
  description?: string | null
  duration_minutes: number
  price: number
  is_active: boolean
  created_at: string
}

export interface Appointment {
  id: number
  client_id: number
  barber_id: number
  service_id: number
  start_at: string
  end_at: string
  status: AppointmentStatus
  notes?: string | null
  created_at: string
  client: User
  barber: User
  service: Service
}

export interface DashboardStats {
  total_clients: number
  total_barbers: number
  total_services: number
  total_appointments: number
  appointments_today: number
  appointments_this_week: number
  revenue_this_month: number
  upcoming_appointments: number
}

export interface AvailabilitySlot {
  start_at: string
  end_at: string
}

import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/Layout'
import { RequireAuth, defaultRoute } from '@/components/RequireAuth'
import { Toaster } from '@/components/ui/Toaster'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Barbers from '@/pages/Barbers'
import Services from '@/pages/Services'
import AppointmentsAdmin from '@/pages/AppointmentsAdmin'
import BarberAgenda from '@/pages/BarberAgenda'
import Book from '@/pages/Book'
import MyAppointments from '@/pages/MyAppointments'
import { useAuth } from '@/store/auth'
import { useTheme } from '@/store/theme'
import { getToken } from '@/lib/api'

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function HomeRedirect() {
  const user = useAuth((s) => s.user)
  const initialized = useAuth((s) => s.initialized)
  if (!initialized) return null
  if (user) return <Navigate to={defaultRoute(user.role)} replace />
  return <Landing />
}

export default function App() {
  const loadMe = useAuth((s) => s.loadMe)
  const setInitialized = useAuth((s) => s.setUser)
  const themeRehydrate = useTheme((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeRehydrate === 'dark')
  }, [themeRehydrate])

  useEffect(() => {
    if (getToken()) {
      loadMe()
    } else {
      // Mark as initialized so RequireAuth can render
      setInitialized(null)
      useAuth.setState({ initialized: true })
    }
  }, [loadMe, setInitialized])

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <RequireAuth roles={['admin']}>
                <Layout>
                  <Dashboard />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/barbers"
            element={
              <RequireAuth roles={['admin']}>
                <Layout>
                  <Barbers />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/services"
            element={
              <RequireAuth roles={['admin']}>
                <Layout>
                  <Services />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/appointments"
            element={
              <RequireAuth roles={['admin']}>
                <Layout>
                  <AppointmentsAdmin />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/agenda"
            element={
              <RequireAuth roles={['barber']}>
                <Layout>
                  <BarberAgenda />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/book"
            element={
              <RequireAuth roles={['client']}>
                <Layout>
                  <Book />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/my-appointments"
            element={
              <RequireAuth roles={['client']}>
                <Layout>
                  <MyAppointments />
                </Layout>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

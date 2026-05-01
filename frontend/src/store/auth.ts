import { create } from 'zustand'
import { api, setToken } from '@/lib/api'
import type { User } from '@/lib/types'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; full_name: string; phone?: string }) => Promise<void>
  logout: () => void
  loadMe: () => Promise<void>
  setUser: (user: User | null) => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  setUser: (user) => set({ user }),
  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data } = await api.post<{ access_token: string }>('/api/auth/login', { email, password })
      setToken(data.access_token)
      const me = await api.get<User>('/api/auth/me')
      set({ user: me.data, initialized: true })
    } finally {
      set({ loading: false })
    }
  },
  register: async (payload) => {
    set({ loading: true })
    try {
      const { data } = await api.post<{ access_token: string }>('/api/auth/register', payload)
      setToken(data.access_token)
      const me = await api.get<User>('/api/auth/me')
      set({ user: me.data, initialized: true })
    } finally {
      set({ loading: false })
    }
  },
  logout: () => {
    setToken(null)
    set({ user: null })
  },
  loadMe: async () => {
    try {
      const { data } = await api.get<User>('/api/auth/me')
      set({ user: data, initialized: true })
    } catch {
      setToken(null)
      set({ user: null, initialized: true })
    }
  },
}))

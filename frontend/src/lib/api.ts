import axios, { type AxiosInstance } from 'axios'

const baseURL = (import.meta.env.VITE_API_URL as string | undefined) || ''

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

const TOKEN_KEY = 'barberia_token'

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    localStorage.removeItem(TOKEN_KEY)
    delete api.defaults.headers.common['Authorization']
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

const initial = getToken()
if (initial) {
  api.defaults.headers.common['Authorization'] = `Bearer ${initial}`
}

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401 && window.location.pathname !== '/login') {
      setToken(null)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

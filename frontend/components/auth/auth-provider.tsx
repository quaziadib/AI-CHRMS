'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { api, authApi, type User } from '@/lib/api'

// ── Role helpers ──────────────────────────────────────────────────────────────
export const hasRole = (user: User | null, ...roles: string[]) =>
  roles.some(r => user?.roles.includes(r))

export const isAdmin = (user: User | null) => hasRole(user, 'admin')
export const isCoPi = (user: User | null) => hasRole(user, 'admin', 'co_pi')
export const isCollector = (user: User | null) => hasRole(user, 'admin', 'co_pi', 'data_collector')
export const isMLEngineer = (user: User | null) => hasRole(user, 'admin', 'ml_engineer')
export const isPatient = (user: User | null) => hasRole(user, 'patient')

/** The home route for a given user role. */
export function homeRouteFor(user: User | null): string {
  if (!user) return '/login'
  if (hasRole(user, 'admin')) return '/admin'
  if (hasRole(user, 'co_pi')) return '/collectors'
  if (hasRole(user, 'data_collector')) return '/patients'
  if (hasRole(user, 'ml_engineer')) return '/ml'
  if (hasRole(user, 'patient')) return '/records'
  return '/records'
}

// ── Context ───────────────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>
  register: (data: {
    email: string
    password: string
    full_name: string
    phone?: string
  }) => Promise<{ success: boolean; error?: string; user?: User }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  // Role shortcuts bound to current user
  isAdmin: boolean
  isCoPi: boolean
  isCollector: boolean
  isMLEngineer: boolean
  isPatient: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ACCESS_TOKEN_KEY = 'health_access_token'
const REFRESH_TOKEN_KEY = 'health_refresh_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const saveTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    api.setAccessToken(accessToken)
  }

  const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    api.setAccessToken(null)
  }

  const refreshUser = useCallback(async () => {
    const { data, error, status } = await authApi.me()
    if (data && !error) {
      setUser(data)
    } else if (status === 401) {
      setUser(null)
      clearTokens()
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (accessToken) {
        api.setAccessToken(accessToken)
        const { data, error, status } = await authApi.me()
        if (data && !error) {
          setUser(data)
        } else if (status === 401) {
          clearTokens()
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    const { data, error } = await authApi.login({ email, password })
    if (data && !error) {
      saveTokens(data.access_token, data.refresh_token)
      setUser(data.user)
      return { success: true, user: data.user }
    }
    return { success: false, error: error || 'Login failed' }
  }

  const register = async (registerData: {
    email: string
    password: string
    full_name: string
    phone?: string
  }): Promise<{ success: boolean; error?: string; user?: User }> => {
    const { data, error } = await authApi.register(registerData)
    if (data && !error) {
      saveTokens(data.access_token, data.refresh_token)
      setUser(data.user)
      return { success: true, user: data.user }
    }
    return { success: false, error: error || 'Registration failed' }
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
    clearTokens()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        isAdmin: isAdmin(user),
        isCoPi: isCoPi(user),
        isCollector: isCollector(user),
        isMLEngineer: isMLEngineer(user),
        isPatient: isPatient(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useRequireAuth() {
  const auth = useAuth()
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = '/login'
    }
  }, [auth.isLoading, auth.isAuthenticated])
  return auth
}

export function useRequireAdmin() {
  const auth = useAuth()
  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.isAuthenticated) {
        window.location.href = '/login'
      } else if (!auth.isAdmin) {
        window.location.href = homeRouteFor(auth.user)
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.isAdmin, auth.user])
  return auth
}

export function useRequireCoPi() {
  const auth = useAuth()
  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.isAuthenticated) {
        window.location.href = '/login'
      } else if (!auth.isCoPi) {
        window.location.href = homeRouteFor(auth.user)
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.isCoPi, auth.user])
  return auth
}

export function useRequireCollector() {
  const auth = useAuth()
  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.isAuthenticated) {
        window.location.href = '/login'
      } else if (!auth.isCollector) {
        window.location.href = homeRouteFor(auth.user)
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.isCollector, auth.user])
  return auth
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as api from './api'

interface AuthContextValue {
  user: api.AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const ACCESS_KEY = 'ur_career_access_token'
const REFRESH_KEY = 'ur_career_refresh_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<api.AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const accessToken = localStorage.getItem(ACCESS_KEY)
    if (!accessToken) {
      setLoading(false)
      return
    }
    api
      .me(accessToken)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(ACCESS_KEY)
        localStorage.removeItem(REFRESH_KEY)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleLogin(email: string, password: string) {
    const tokens = await api.login(email, password)
    localStorage.setItem(ACCESS_KEY, tokens.access_token)
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
    setUser(await api.me(tokens.access_token))
  }

  async function handleRegister(email: string, password: string) {
    await api.register(email, password)
    await handleLogin(email, password)
  }

  async function handleLogout() {
    const refreshToken = localStorage.getItem(REFRESH_KEY)
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    setUser(null)
    if (refreshToken) {
      await api.logout(refreshToken).catch(() => {
        // already signed out client-side; a failed revoke server-side isn't worth surfacing
      })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

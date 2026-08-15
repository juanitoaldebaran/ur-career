const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (res.status === 204) {
    return undefined as T
  }

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      body && typeof body.error === 'string' ? body.error : `request failed (${res.status})`
    throw new ApiError(res.status, message)
  }

  return body as T
}

export interface AuthUser {
  user_id: string
  email: string
}

export interface RegisteredUser {
  id: string
  email: string
  created_at: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
}

export function register(email: string, password: string): Promise<RegisteredUser> {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function login(email: string, password: string): Promise<TokenPair> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function refresh(refreshToken: string): Promise<TokenPair> {
  return request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

export function logout(refreshToken: string): Promise<void> {
  return request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

export function me(accessToken: string): Promise<AuthUser> {
  return request('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

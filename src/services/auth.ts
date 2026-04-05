const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth`
const TOKEN_KEY = 'gym-tracker-token'
const USER_KEY = 'gym-tracker-auth-user'

export interface AuthUser {
  id: string
  email: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  return JSON.parse(raw)
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}

function saveAuth(data: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(USER_KEY, JSON.stringify(data.user))
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Error al registrarse')
  }

  const data: AuthResponse = await res.json()
  saveAuth(data)
  return data
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Error al iniciar sesión')
  }

  const data: AuthResponse = await res.json()
  saveAuth(data)
  return data
}

export async function loginWithGoogle(credential: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Error al iniciar sesión con Google')
  }

  const data: AuthResponse = await res.json()
  saveAuth(data)
  return data
}

export function logout(): void {
  clearAuth()
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5002/api'
const STORAGE_KEY = 'futurewings.auth'

export function loadSession() {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!session?.token || new Date(session.expiresAt) <= new Date()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return session
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}

export async function authenticate(endpoint, credentials) {
  const response = await fetch(`${API_URL}/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const validationMessage = body.errors ? Object.values(body.errors).flat().join(' ') : null
    throw new Error(body.message || validationMessage || 'Authentication failed. Please try again.')
  }
  return body
}

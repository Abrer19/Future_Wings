const API_URL = import.meta.env.VITE_API_URL ?? '/api'
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
  const response = await fetchApi(`${API_URL}/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const validationMessage = body.errors ? Object.values(body.errors).flat().join(' ') : null
    const problemMessage = body.detail || (body.title && body.status < 500 ? body.title : null)
    const fallback = response.status >= 500
      ? 'The server could not complete your request. Please try again in a moment.'
      : response.status === 409
        ? 'An account with this email already exists. Try signing in instead.'
        : 'Authentication failed. Please check your details and try again.'
    throw new Error(body.message || validationMessage || problemMessage || fallback)
  }
  return body
}

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = { ...options.headers }
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetchApi(`${API_URL}${path}`, { ...options, headers })
  if (response.status === 204) return null

  if (response.status === 401) {
    clearSession()
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('futurewings:unauthorized'))
    }
    throw new Error('Your session has expired. Please sign in again.')
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const validationMessage = body.errors ? Object.values(body.errors).flat().join(' ') : null
    throw new Error(body.message || validationMessage || 'The request could not be completed.')
  }
  return body
}

async function fetchApi(url, options) {
  try {
    return await fetch(url, options)
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Unable to connect to FutureWings. Please make sure the backend is running and try again.')
  }
}

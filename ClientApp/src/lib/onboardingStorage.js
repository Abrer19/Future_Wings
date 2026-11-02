/**
 * FutureWings Guided Onboarding Storage Utility
 *
 * Persists onboarding state per user account:
 *   Key: `futurewings.onboarding.<userId>`
 *
 * State shape:
 * {
 *   version: 1,
 *   userId: 123,
 *   status: "not_started" | "in_progress" | "completed" | "skipped",
 *   completedSteps: [0, 1, ...],
 *   currentStepIndex: 0,
 *   startedAt: "...",
 *   completedAt: "...",
 *   skippedAt: "...",
 *   updatedAt: "..."
 * }
 *
 * Provides safe fallback from localStorage to sessionStorage to memory.
 */

const STORAGE_PREFIX = 'futurewings.onboarding.'
const CURRENT_VERSION = 1
const memoryStorage = new Map()

/**
 * Returns safe available web storage engine, falling back from localStorage to sessionStorage.
 */
function getStorageEngine() {
  if (typeof window === 'undefined') return null

  try {
    const testKey = '__fw_storage_test__'
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return window.localStorage
  } catch {
    try {
      const testKey = '__fw_storage_test__'
      window.sessionStorage.setItem(testKey, '1')
      window.sessionStorage.removeItem(testKey)
      return window.sessionStorage
    } catch {
      return null // In-memory fallback
    }
  }
}

/**
 * Clears all tour records from storage and memory (useful for testing or cache resets).
 */
export function clearAllTourRecords() {
  memoryStorage.clear()
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.clear()
      window.sessionStorage.clear()
    } catch {
      // Ignore
    }
  }
}

/**
 * Generates user-isolated storage key.
 */
export function getStorageKey(userId) {
  const safeId = userId !== undefined && userId !== null && String(userId).trim() !== ''
    ? String(userId).trim()
    : 'guest'
  return `${STORAGE_PREFIX}${safeId}`
}

/**
 * Loads the existing onboarding record for a user.
 */
export function loadTourRecord(userId) {
  if (typeof window === 'undefined') return null
  const key = getStorageKey(userId)

  try {
    const storage = getStorageEngine()
    let raw = storage ? storage.getItem(key) : null

    // Check secondary fallback if not found in primary
    if (!raw && storage === window.localStorage) {
      try {
        raw = window.sessionStorage.getItem(key)
      } catch {
        // Ignore
      }
    }

    if (!raw) {
      raw = memoryStorage.get(key) || null
    }

    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.status === 'string') {
      return {
        version: parsed.version ?? CURRENT_VERSION,
        userId: parsed.userId ?? userId,
        status: parsed.status,
        completedSteps: Array.isArray(parsed.completedSteps) ? parsed.completedSteps : [],
        currentStepIndex: typeof parsed.currentStepIndex === 'number' ? parsed.currentStepIndex : 0,
        startedAt: parsed.startedAt || null,
        completedAt: parsed.completedAt || null,
        skippedAt: parsed.skippedAt || null,
        updatedAt: parsed.updatedAt || null,
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Saves or updates the onboarding record for a user.
 */
export function saveTourRecord(userId, patch) {
  const key = getStorageKey(userId)
  const existing = loadTourRecord(userId)
  const now = new Date().toISOString()

  const status = patch.status || existing?.status || 'not_started'
  const currentStepIndex = typeof patch.currentStepIndex === 'number'
    ? patch.currentStepIndex
    : existing?.currentStepIndex ?? 0

  const completedSteps = Array.isArray(patch.completedSteps)
    ? patch.completedSteps
    : existing?.completedSteps || []

  const record = {
    version: CURRENT_VERSION,
    userId: userId ?? existing?.userId ?? 'guest',
    status,
    completedSteps,
    currentStepIndex,
    startedAt: status === 'in_progress' && !existing?.startedAt ? now : (existing?.startedAt || null),
    completedAt: status === 'completed' ? now : (existing?.completedAt || null),
    skippedAt: status === 'skipped' ? now : (existing?.skippedAt || null),
    updatedAt: now,
  }

  const serialized = JSON.stringify(record)

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, serialized)
    } catch {
      // localStorage unavailable or quota exceeded
    }

    try {
      window.sessionStorage.setItem(key, serialized)
    } catch {
      // sessionStorage unavailable
    }
  }

  memoryStorage.set(key, serialized)
  return record
}

/**
 * Resets the tour for a user so they can take it again on demand.
 */
export function resetTourRecord(userId) {
  return saveTourRecord(userId, {
    status: 'in_progress',
    currentStepIndex: 0,
    completedSteps: [],
  })
}

/**
 * Checks whether the onboarding tour should automatically open for this session.
 * - Exempts demo judge account (demo@futurewings.io) from automatic popups.
 * - Exempts non-student roles (Admin, Agent).
 * - Triggers only for new registrations (status null or not_started) or resuming in_progress.
 */
export function isTourEligible(session) {
  if (!session || !session.token) return false

  // Never interrupt privileged roles
  if (session.role === 'Admin' || session.role === 'Agent') return false

  // Protect judge demo account from unexpected automatic popups
  const email = (session.email || '').toLowerCase().trim()
  if (email === 'demo@futurewings.io') {
    // If demo has no record yet, record it as completed so it stays quiet
    const existing = loadTourRecord(session.userId)
    if (!existing) {
      saveTourRecord(session.userId, {
        status: 'completed',
        completedSteps: [0, 1, 2, 3, 4, 5],
      })
    }
    return false
  }

  const record = loadTourRecord(session.userId)
  if (!record) return true // First-time new user!
  if (record.status === 'not_started' || record.status === 'in_progress') return true

  return false // 'completed' or 'skipped'
}

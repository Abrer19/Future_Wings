import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getStorageKey,
  loadTourRecord,
  saveTourRecord,
  resetTourRecord,
  isTourEligible,
} from './onboardingStorage.js'

describe('onboardingStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('formats storage key correctly per user id', () => {
    expect(getStorageKey(123)).toBe('futurewings.onboarding.123')
    expect(getStorageKey('user-456')).toBe('futurewings.onboarding.user-456')
    expect(getStorageKey(null)).toBe('futurewings.onboarding.guest')
  })

  it('saves and loads tour record with timestamps and step data', () => {
    const saved = saveTourRecord(101, {
      status: 'in_progress',
      currentStepIndex: 2,
      completedSteps: [0, 1],
    })

    expect(saved.version).toBe(1)
    expect(saved.userId).toBe(101)
    expect(saved.status).toBe('in_progress')
    expect(saved.currentStepIndex).toBe(2)
    expect(saved.completedSteps).toEqual([0, 1])
    expect(saved.startedAt).toBeTruthy()
    expect(saved.completedAt).toBeNull()

    const loaded = loadTourRecord(101)
    expect(loaded).toEqual(saved)
  })

  it('marks completed and skipped timestamps appropriately', () => {
    const completed = saveTourRecord(102, {
      status: 'completed',
      completedSteps: [0, 1, 2, 3, 4, 5],
    })
    expect(completed.completedAt).toBeTruthy()
    expect(completed.skippedAt).toBeNull()

    const skipped = saveTourRecord(103, {
      status: 'skipped',
    })
    expect(skipped.skippedAt).toBeTruthy()
  })

  it('resets tour record on demand', () => {
    saveTourRecord(104, { status: 'completed' })
    const reset = resetTourRecord(104)
    expect(reset.status).toBe('in_progress')
    expect(reset.currentStepIndex).toBe(0)
    expect(reset.completedSteps).toEqual([])
  })

  it('exempts demo judge account and non-student roles from auto-trigger', () => {
    const demoSession = {
      userId: 1,
      email: 'demo@futurewings.io',
      role: 'Student',
      token: 'mock-token',
    }
    expect(isTourEligible(demoSession)).toBe(false)

    const adminSession = {
      userId: 2,
      email: 'admin@futurewings.io',
      role: 'Admin',
      token: 'mock-token',
    }
    expect(isTourEligible(adminSession)).toBe(false)

    const agentSession = {
      userId: 3,
      email: 'agent@futurewings.io',
      role: 'Agent',
      token: 'mock-token',
    }
    expect(isTourEligible(agentSession)).toBe(false)
  })

  it('triggers for newly registered student and resumes in_progress, but stops when completed', () => {
    const newStudent = {
      userId: 999,
      email: 'newstudent@test.com',
      role: 'Student',
      token: 'mock-token',
    }

    // New user without record
    expect(isTourEligible(newStudent)).toBe(true)

    // User in progress (resumes on refresh)
    saveTourRecord(999, { status: 'in_progress', currentStepIndex: 2 })
    expect(isTourEligible(newStudent)).toBe(true)

    // User completed tour
    saveTourRecord(999, { status: 'completed' })
    expect(isTourEligible(newStudent)).toBe(false)

    // User skipped tour
    saveTourRecord(999, { status: 'skipped' })
    expect(isTourEligible(newStudent)).toBe(false)
  })

  it('falls back gracefully if localStorage fails', () => {
    const originalSetItem = window.localStorage.setItem
    window.localStorage.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError')
    })

    const record = saveTourRecord(888, { status: 'in_progress' })
    expect(record.status).toBe('in_progress')

    // Still loaded from sessionStorage or memory
    const loaded = loadTourRecord(888)
    expect(loaded?.status).toBe('in_progress')

    window.localStorage.setItem = originalSetItem
  })
})

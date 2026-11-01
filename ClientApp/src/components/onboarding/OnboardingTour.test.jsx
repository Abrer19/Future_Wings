import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OnboardingTour from './OnboardingTour.jsx'
import { loadTourRecord, clearAllTourRecords } from '../../lib/onboardingStorage.js'

describe('OnboardingTour', () => {
  beforeEach(() => {
    clearAllTourRecords()
  })

  it('renders Step 1 (Welcome) with title, highlights and primary action', () => {
    const session = { userId: 301, email: 'student1@futurewings.io', role: 'Student', token: 'mock' }
    render(
      <OnboardingTour
        activePage="Dashboard"
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        session={session}
      />
    )

    expect(screen.getByRole('dialog', { name: /product tour/i })).toBeTruthy()
    expect(screen.getByText('1 of 6')).toBeTruthy()
    expect(screen.getByText(/Your AI-Powered Study Abroad Command Center/i)).toBeTruthy()
    expect(screen.getByText(/Start Guided Tour/i)).toBeTruthy()
  })

  it('advances to Step 2 and requests navigation to Profile', () => {
    const session = { userId: 302, email: 'student2@futurewings.io', role: 'Student', token: 'mock' }
    const handleNavigate = vi.fn()
    render(
      <OnboardingTour
        activePage="Dashboard"
        onClose={vi.fn()}
        onNavigate={handleNavigate}
        session={session}
      />
    )

    const nextBtn = screen.getByRole('button', { name: /Start Guided Tour/i })
    fireEvent.click(nextBtn)

    expect(screen.getByText('2 of 6')).toBeTruthy()
    expect(screen.getByText(/Calibrate Your Academic & Budget Baseline/i)).toBeTruthy()
    expect(handleNavigate).toHaveBeenCalledWith('Profile')
  })

  it('navigates back to previous step when Back button is clicked', () => {
    const session = { userId: 303, email: 'student3@futurewings.io', role: 'Student', token: 'mock' }
    render(
      <OnboardingTour
        activePage="Dashboard"
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        session={session}
      />
    )

    // Advance to step 2
    fireEvent.click(screen.getByRole('button', { name: /Start Guided Tour/i }))
    expect(screen.getByText('2 of 6')).toBeTruthy()

    // Click Back
    const backBtn = screen.getByRole('button', { name: /Back/i })
    fireEvent.click(backBtn)
    expect(screen.getByText('1 of 6')).toBeTruthy()
  })

  it('skips tour when Skip Tour button is clicked', () => {
    const session = { userId: 304, email: 'student4@futurewings.io', role: 'Student', token: 'mock' }
    const handleClose = vi.fn()
    render(
      <OnboardingTour
        activePage="Dashboard"
        onClose={handleClose}
        onNavigate={vi.fn()}
        session={session}
      />
    )

    const skipBtn = screen.getByRole('button', { name: 'Skip Tour' })
    fireEvent.click(skipBtn)

    expect(handleClose).toHaveBeenCalled()
    const record = loadTourRecord(304)
    expect(record?.status).toBe('skipped')
  })

  it('skips tour on Escape key press', () => {
    const session = { userId: 305, email: 'student5@futurewings.io', role: 'Student', token: 'mock' }
    const handleClose = vi.fn()
    render(
      <OnboardingTour
        activePage="Dashboard"
        onClose={handleClose}
        onNavigate={vi.fn()}
        session={session}
      />
    )

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(handleClose).toHaveBeenCalled()
    const record = loadTourRecord(305)
    expect(record?.status).toBe('skipped')
  })

  it('advances on ArrowRight key press', () => {
    const session = { userId: 306, email: 'student6@futurewings.io', role: 'Student', token: 'mock' }
    render(
      <OnboardingTour
        activePage="Dashboard"
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        session={session}
      />
    )

    expect(screen.getByText('1 of 6')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('2 of 6')).toBeTruthy()
  })
})

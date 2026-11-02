import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Recommendations from './Recommendations.jsx'
import { apiRequest } from '../auth.js'

vi.mock('../auth.js', () => ({
  apiRequest: vi.fn(),
}))

const mockSession = {
  token: 'mock-jwt-token',
  role: 'Student',
  userId: 'user-1',
}

const mockProfileComplete = {
  id: 1,
  userId: 1,
  firstName: 'David',
  lastName: 'Lee',
  cgpa: 3.8,
  major: 'Computer Science',
  budgetUsd: 40000,
  degreeLevel: "Master's",
}

const mockRecommendations = [
  {
    programId: 101,
    universityId: 1,
    programName: 'M.Sc. Artificial Intelligence',
    universityName: 'Technical University of Munich',
    matchScore: 95.5,
    reason: 'Strong alignment with your interest in Computer Science.',
    country: 'Germany',
    city: 'Munich',
    level: "Master's",
    annualTuitionUsd: 1500,
    durationMonths: 24,
    tags: ['AI', 'Data Science'],
    isSaved: false,
    isTracked: false,
    applicationId: null,
  },
  {
    programId: 102,
    universityId: 2,
    programName: 'M.Sc. Data Science',
    universityName: 'University of Oxford',
    matchScore: 91.0,
    reason: 'Tuition fits within your budget.',
    country: 'United Kingdom',
    city: 'Oxford',
    level: "Master's",
    annualTuitionUsd: 38000,
    durationMonths: 12,
    tags: ['Machine Learning', 'STEM'],
    isSaved: true,
    isTracked: true,
    applicationId: 55,
  },
]

describe('Recommendations Page - Application Tracker Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiRequest.mockImplementation((url, opts) => {
      if (url === '/profile') return Promise.resolve(mockProfileComplete)
      if (url === '/recommendation') return Promise.resolve(mockRecommendations)
      if (url === '/applications' && opts?.method === 'POST') {
        return Promise.resolve({ id: 99, programId: 101, status: 'Draft' })
      }
      if (url === '/applications') {
        return Promise.resolve([{ applicationId: 55, programId: 102, status: 'Draft' }])
      }
      if (url.startsWith('/discovery/saved/')) {
        return Promise.resolve({ success: true })
      }
      return Promise.resolve({})
    })
  })

  it('renders "Add to Application Tracker" on untracked cards and "In Application Tracker" on tracked cards', async () => {
    render(<Recommendations session={mockSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('track-program-btn-101')).toBeInTheDocument()
      expect(screen.getByTestId('track-program-btn-102')).toBeInTheDocument()
    })

    // Program 101 is not tracked
    expect(screen.getByTestId('track-program-btn-101')).toHaveTextContent('Add to Application Tracker')

    // Program 102 is tracked
    expect(screen.getByTestId('track-program-btn-102')).toHaveTextContent('In Application Tracker')
  })

  it('tracks a recommended program successfully and updates card immediately with toast notification', async () => {
    const onNavigateMock = vi.fn()
    render(<Recommendations onNavigate={onNavigateMock} session={mockSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('track-program-btn-101')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('track-program-btn-101'))

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/applications', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ programId: 101 }),
      }))
      expect(screen.getByText('Added to Application Tracker')).toBeInTheDocument()
      expect(screen.getByText('View Application Tracker')).toBeInTheDocument()
      expect(screen.getByTestId('track-program-btn-101')).toHaveTextContent('In Application Tracker')
    })

    // Clicking "View Application Tracker" navigates to Applications page
    fireEvent.click(screen.getByText('View Application Tracker'))
    expect(onNavigateMock).toHaveBeenCalledWith('Applications')
  })

  it('clicking "In Application Tracker" on a tracked card navigates to Applications tracker', async () => {
    const onNavigateMock = vi.fn()
    render(<Recommendations onNavigate={onNavigateMock} session={mockSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('track-program-btn-102')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('track-program-btn-102'))
    expect(onNavigateMock).toHaveBeenCalledWith('Applications')
  })

  it('handles duplicate track gracefully without unhandled errors', async () => {
    apiRequest.mockImplementation((url, opts) => {
      if (url === '/profile') return Promise.resolve(mockProfileComplete)
      if (url === '/recommendation') return Promise.resolve(mockRecommendations)
      if (url === '/applications' && opts?.method === 'POST') {
        return Promise.reject(new Error('You are already tracking an application for this program.'))
      }
      if (url === '/applications') return Promise.resolve([])
      return Promise.resolve({})
    })

    render(<Recommendations session={mockSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('track-program-btn-101')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('track-program-btn-101'))

    await waitFor(() => {
      expect(screen.getByText('This program is already in your Application Tracker.')).toBeInTheDocument()
      expect(screen.getByTestId('track-program-btn-101')).toHaveTextContent('In Application Tracker')
    })
  })

  it('preserves separate save to shortlist behavior alongside application tracker action', async () => {
    render(<Recommendations session={mockSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('save-program-btn-101')).toBeInTheDocument()
      expect(screen.getByTestId('track-program-btn-101')).toBeInTheDocument()
    })

    // Shortlist button is separate
    const saveBtn = screen.getByTestId('save-program-btn-101')
    expect(saveBtn).toHaveTextContent('Save to Shortlist')

    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/discovery/saved/101', expect.objectContaining({ method: 'PUT' }))
      expect(saveBtn).toHaveTextContent('Saved ✓')
    })

    // Tracker button state is unchanged
    expect(screen.getByTestId('track-program-btn-101')).toHaveTextContent('Add to Application Tracker')
  })

  it('handles API error when tracking and restores usable button state', async () => {
    apiRequest.mockImplementation((url, opts) => {
      if (url === '/profile') return Promise.resolve(mockProfileComplete)
      if (url === '/recommendation') return Promise.resolve(mockRecommendations)
      if (url === '/applications' && opts?.method === 'POST') {
        return Promise.reject(new Error('Server gateway timeout'))
      }
      if (url === '/applications') return Promise.resolve([])
      return Promise.resolve({})
    })

    render(<Recommendations session={mockSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('track-program-btn-101')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('track-program-btn-101'))

    await waitFor(() => {
      expect(screen.getByText('Server gateway timeout')).toBeInTheDocument()
      expect(screen.getByTestId('track-program-btn-101')).not.toBeDisabled()
      expect(screen.getByTestId('track-program-btn-101')).toHaveTextContent('Add to Application Tracker')
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import Discovery from './Discovery.jsx'
import ProgramDetailsModal from '../components/discovery/ProgramDetailsModal.jsx'
import { apiRequest } from '../auth.js'

vi.mock('../auth.js', () => ({
  apiRequest: vi.fn(),
}))

vi.mock('../lib/useAiSearch.js', () => ({
  useAiSearch: () => ({
    classify: vi.fn(),
    status: 'ready',
    error: '',
  }),
}))

const mockSession = {
  token: 'mock-jwt-token',
  role: 'Student',
  userId: 'user-1',
}

const mockDiscoveryResult = {
  featuredCountries: [
    { id: 1, name: 'Germany', code: 'DE', description: 'World-class tuition-free universities.', programCount: 12 },
    { id: 2, name: 'United Kingdom', code: 'GB', description: 'Globally renowned research institutions.', programCount: 18 },
  ],
  countries: ['Germany', 'United Kingdom', 'United States'],
  levels: ["Master's", "Bachelor's", 'PhD'],
  studyTracks: ['AI & Robotics', 'Data Science', 'Silicon Valley Hub', 'STEM'],
  totalCount: 2,
  programs: [
    {
      id: 1,
      universityId: 10,
      university: 'Technical University of Munich',
      name: 'M.Sc. Artificial Intelligence',
      level: "Master's",
      durationMonths: 24,
      annualTuitionUsd: 1200,
      city: 'Munich',
      country: 'Germany',
      matchScore: 94,
      tags: ['AI & Robotics', 'STEM'],
      isSaved: false,
      isTracked: false,
      applicationId: null,
      description: 'Advanced research-focused AI master program.',
      requirements: 'B.Sc. in CS, IELTS 7.0 or TOEFL 95.',
      officialLink: 'https://tum.de/ai',
    },
    {
      id: 2,
      universityId: 11,
      university: 'University of Oxford',
      name: 'M.Sc. Advanced Computer Science',
      level: "Master's",
      durationMonths: 12,
      annualTuitionUsd: 38000,
      city: 'Oxford',
      country: 'United Kingdom',
      matchScore: 89,
      tags: ['Data Science', 'STEM'],
      isSaved: true,
      isTracked: true,
      applicationId: 44,
      description: null,
      requirements: null,
      officialLink: null,
    },
  ],
}

describe('Discovery Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiRequest.mockImplementation((url) => {
      if (url.startsWith('/discovery?')) {
        return Promise.resolve(mockDiscoveryResult)
      }
      if (url === '/discovery/saved') {
        return Promise.resolve([mockDiscoveryResult.programs[1]])
      }
      if (url.startsWith('/discovery/programs/1')) {
        return Promise.resolve(mockDiscoveryResult.programs[0])
      }
      if (url.startsWith('/discovery/programs/2')) {
        return Promise.resolve(mockDiscoveryResult.programs[1])
      }
      if (url.startsWith('/discovery/saved/')) {
        return Promise.resolve({ success: true })
      }
      if (url === '/applications') {
        return Promise.resolve({ id: 99, programId: 1, status: 'Draft' })
      }
      return Promise.resolve({})
    })
  })

  it('renders Featured Study Track dropdown with "All study tracks" and real catalog tracks', async () => {
    render(<Discovery session={mockSession} />)

    // Wait for debounced initial load to complete
    await waitFor(() => {
      expect(screen.getByText('Technical University of Munich')).toBeInTheDocument()
    })

    const trackSelect = screen.getByTestId('track-filter')
    const options = Array.from(trackSelect.querySelectorAll('option')).map((o) => o.textContent)

    expect(options).toContain('All study tracks')
    expect(options).toContain('AI & Robotics')
    expect(options).toContain('Data Science')
    expect(options).toContain('Silicon Valley Hub')
    expect(options).toContain('STEM')
  })

  it('filters by study track alone and combines with destination and level filters', async () => {
    render(<Discovery session={mockSession} />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Technical University of Munich')).toBeInTheDocument()
    })

    // Select a study track
    fireEvent.change(screen.getByTestId('track-filter'), { target: { value: 'AI & Robotics' } })

    await waitFor(() => {
      const calls = apiRequest.mock.calls.map((call) => call[0])
      const trackCall = calls.find((c) => c.includes('track=AI') || c.includes('track=AI+%26+Robotics'))
      expect(trackCall).toBeDefined()
    }, { timeout: 2000 })

    // Also select a country
    fireEvent.change(screen.getByTestId('country-filter'), { target: { value: 'Germany' } })

    await waitFor(() => {
      const calls = apiRequest.mock.calls.map((call) => call[0])
      const combinedCall = calls.find((c) => c.includes('country=Germany') && (c.includes('track=AI') || c.includes('track=AI+%26+Robotics')))
      expect(combinedCall).toBeDefined()
    }, { timeout: 2000 })
  })

  it('clearing study track filters resets dropdown and active filter chip', async () => {
    render(<Discovery session={mockSession} />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Technical University of Munich')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByTestId('track-filter'), { target: { value: 'Data Science' } })

    await waitFor(() => {
      expect(screen.getByText(/Track:\s*Data Science/i)).toBeInTheDocument()
    })

    // Click remove button on the active filter chip
    const removeBtn = screen.getByRole('button', { name: /Remove track filter Data Science/i })
    fireEvent.click(removeBtn)

    await waitFor(() => {
      expect(screen.getByTestId('track-filter')).toHaveValue('')
      expect(screen.queryByText(/Track:\s*Data Science/i)).not.toBeInTheDocument()
    })
  })

  it('clicking a featured track chip syncs with track state and filters catalog', async () => {
    render(<Discovery session={mockSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('track-chip-STEM')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('track-chip-STEM'))

    await waitFor(() => {
      expect(screen.getByTestId('track-filter')).toHaveValue('STEM')
      expect(screen.getByText(/Track:\s*STEM/i)).toBeInTheDocument()
    })

    // Clicking again toggles off
    fireEvent.click(screen.getByTestId('track-chip-STEM'))

    await waitFor(() => {
      expect(screen.getByTestId('track-filter')).toHaveValue('')
    })
  })

  it('clicking View Details opens the dedicated program details modal with program info without navigating away', async () => {
    const onNavigateMock = vi.fn()
    render(<Discovery onNavigate={onNavigateMock} session={mockSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-details-1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('view-details-1'))

    await waitFor(() => {
      const modal = screen.getByTestId('program-details-modal')
      expect(modal).toBeInTheDocument()
      expect(within(modal).getByRole('heading', { name: 'M.Sc. Artificial Intelligence', level: 2 })).toBeInTheDocument()
      expect(within(modal).getAllByText(/Technical University of Munich/i).length).toBeGreaterThan(0)
      expect(within(modal).getByText('Advanced research-focused AI master program.')).toBeInTheDocument()
      expect(within(modal).getByText('B.Sc. in CS, IELTS 7.0 or TOEFL 95.')).toBeInTheDocument()
      expect(within(modal).getByTestId('details-official-link')).toHaveAttribute('href', 'https://tum.de/ai')
    })

    expect(onNavigateMock).not.toHaveBeenCalled()
  })

  it('displays "Not specified" for missing optional fields in program details', async () => {
    render(<Discovery session={mockSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-details-2')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('view-details-2'))

    await waitFor(() => {
      const modal = screen.getByTestId('program-details-modal')
      expect(modal).toBeInTheDocument()
      expect(within(modal).getByRole('heading', { name: 'M.Sc. Advanced Computer Science', level: 2 })).toBeInTheDocument()
      expect(within(modal).getByTestId('details-description')).toHaveTextContent('Not specified')
      expect(within(modal).getByTestId('details-requirements')).toHaveTextContent('Not specified')
      expect(within(modal).getByTestId('details-official-link-empty')).toHaveTextContent('Not specified')
    })
  })

  it('toggles save/unsave from program details view', async () => {
    render(<Discovery session={mockSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-details-1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('view-details-1'))

    await waitFor(() => {
      expect(screen.getByTestId('details-save-btn')).toBeInTheDocument()
      expect(screen.getByText('Save to Shortlist')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('details-save-btn'))

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/discovery/saved/1', expect.objectContaining({ method: 'PUT' }))
      expect(screen.getByText('Saved in Shortlist')).toBeInTheDocument()
    })
  })

  it('adds program to application tracking from details view', async () => {
    render(<Discovery session={mockSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-details-1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('view-details-1'))

    await waitFor(() => {
      expect(screen.getByTestId('details-add-application-btn')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('details-add-application-btn'))

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/applications', expect.objectContaining({
        method: 'POST',
        body: { programId: 1 },
      }))
      expect(screen.getByText('Added to Application Tracker!')).toBeInTheDocument()
      expect(screen.getByTestId('details-view-applications-btn')).toBeInTheDocument()
    })
  })

  it('renders "Add to Application Tracker" button on program cards and tracks program successfully with toast', async () => {
    const onNavigateMock = vi.fn()
    render(<Discovery onNavigate={onNavigateMock} session={mockSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('track-program-btn-1')).toBeInTheDocument()
    })

    const trackBtn1 = screen.getByTestId('track-program-btn-1')
    expect(trackBtn1).toHaveTextContent('Add to Application Tracker')

    // Program 2 is already tracked
    const trackBtn2 = screen.getByTestId('track-program-btn-2')
    expect(trackBtn2).toHaveTextContent('In Application Tracker')

    // Click track on program 1
    fireEvent.click(trackBtn1)

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/applications', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ programId: 1 }),
      }))
      expect(screen.getByText('Added to Application Tracker')).toBeInTheDocument()
      expect(screen.getByText('View Application Tracker')).toBeInTheDocument()
      expect(screen.getByTestId('track-program-btn-1')).toHaveTextContent('In Application Tracker')
    })

    // Click View Application Tracker in toast
    fireEvent.click(screen.getByText('View Application Tracker'))
    expect(onNavigateMock).toHaveBeenCalledWith('Applications')
  })

  it('handles duplicate track gracefully without unhandled error and preserves separate save/unsave', async () => {
    apiRequest.mockImplementation((url, opts) => {
      if (url.startsWith('/discovery?')) return Promise.resolve(mockDiscoveryResult)
      if (url === '/discovery/saved') return Promise.resolve([])
      if (url === '/applications' && opts?.method === 'POST') {
        return Promise.reject(new Error('You are already tracking an application for this program.'))
      }
      if (url === '/applications') return Promise.resolve([])
      if (url.startsWith('/discovery/saved/')) return Promise.resolve({ success: true })
      return Promise.resolve({})
    })

    render(<Discovery session={mockSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('track-program-btn-1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('track-program-btn-1'))

    await waitFor(() => {
      expect(screen.getByText('This program is already in your Application Tracker.')).toBeInTheDocument()
      expect(screen.getByTestId('track-program-btn-1')).toHaveTextContent('In Application Tracker')
    })

    // Shortlist heart button remains separate and functional
    const bookmarkBtn = screen.getByRole('button', { name: /Add M.Sc. Artificial Intelligence to shortlist/i })
    expect(bookmarkBtn).toBeInTheDocument()
    fireEvent.click(bookmarkBtn)

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/discovery/saved/1', expect.objectContaining({ method: 'PUT' }))
    })
  })

  it('modal closes on Back to Programs button, close button, and Escape key', async () => {
    render(<Discovery session={mockSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-details-1')).toBeInTheDocument()
    })

    // Open modal
    fireEvent.click(screen.getByTestId('view-details-1'))
    await waitFor(() => {
      expect(screen.getByTestId('program-details-modal')).toBeInTheDocument()
    })

    // Close via Back to Programs button
    fireEvent.click(screen.getByTestId('return-search-btn'))
    await waitFor(() => {
      expect(screen.queryByTestId('program-details-modal')).not.toBeInTheDocument()
    })

    // Open again and close via X button
    fireEvent.click(screen.getByTestId('view-details-1'))
    await waitFor(() => {
      expect(screen.getByTestId('program-details-modal')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('close-details-btn'))
    await waitFor(() => {
      expect(screen.queryByTestId('program-details-modal')).not.toBeInTheDocument()
    })

    // Open again and close via Escape key
    fireEvent.click(screen.getByTestId('view-details-1'))
    await waitFor(() => {
      expect(screen.getByTestId('program-details-modal')).toBeInTheDocument()
    })
    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByTestId('program-details-modal')).not.toBeInTheDocument()
    })
  })
})

describe('ProgramDetailsModal Component - Direct Lookup States', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles direct lookup by programId with loading, success, and rendering', async () => {
    apiRequest.mockResolvedValueOnce(mockDiscoveryResult.programs[0])

    render(
      <ProgramDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        programId={1}
        session={mockSession}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('program-details-modal')).toBeInTheDocument()
      expect(screen.getByText('M.Sc. Artificial Intelligence')).toBeInTheDocument()
    })
  })

  it('handles 404 not found state gracefully', async () => {
    apiRequest.mockRejectedValueOnce(new Error('404 Program not found.'))

    render(
      <ProgramDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        programId={999}
        session={mockSession}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('details-not-found-state')).toBeInTheDocument()
      expect(screen.getByText('Program Not Found')).toBeInTheDocument()
    })
  })

  it('handles API failure with retry action', async () => {
    apiRequest
      .mockRejectedValueOnce(new Error('Network gateway error'))
      .mockResolvedValueOnce(mockDiscoveryResult.programs[0])

    render(
      <ProgramDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        programId={1}
        session={mockSession}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('details-error')).toBeInTheDocument()
      expect(screen.getByText('Network gateway error')).toBeInTheDocument()
    })

    // Click retry
    fireEvent.click(screen.getByTestId('details-retry-btn'))

    await waitFor(() => {
      expect(screen.getByText('M.Sc. Artificial Intelligence')).toBeInTheDocument()
      expect(screen.queryByTestId('details-error')).not.toBeInTheDocument()
    })
  })
})

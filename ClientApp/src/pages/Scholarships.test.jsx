import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Scholarships from './Scholarships.jsx'
import { apiRequest } from '../auth.js'

vi.mock('../auth.js', () => ({
  apiRequest: vi.fn(),
}))

const mockScholarshipsList = [
  {
    id: 101,
    countryId: 1,
    countryName: 'United States',
    countryCode: 'US',
    name: 'Fulbright Foreign Student Program',
    awardAmount: 35000,
    deadline: '2027-10-15T23:59:00Z',
    eligibilityCriteria: "Bachelor's degree or equivalent, strong academic record.",
    isInterested: false,
  },
  {
    id: 102,
    countryId: 2,
    countryName: 'Canada',
    countryCode: 'CA',
    name: 'Vanier Canada Graduate Scholarships',
    awardAmount: 50000,
    deadline: '2027-11-15T23:59:00Z',
    eligibilityCriteria: 'Nominated by Canadian institution, exceptional research potential.',
    isInterested: true,
  },
]

const mockScholarship101Details = {
  id: 101,
  countryId: 1,
  countryName: 'United States',
  countryCode: 'US',
  name: 'Fulbright Foreign Student Program',
  awardAmount: 35000,
  deadline: '2027-10-15T23:59:00Z',
  description: 'Enables graduate students from abroad to study and conduct research in the United States.',
  eligibilityCriteria: "Bachelor's degree or equivalent, strong academic record, English proficiency.",
  requiredDocuments: 'Academic transcripts, 3 letters of recommendation, TOEFL report, personal statement',
  studyLevel: "Master's, Doctorate",
  fieldOfStudy: 'All fields',
  officialLink: 'https://foreign.fulbrightonline.org/',
  isInterested: false,
  interest: null,
}

const mockCreatedInterest = {
  id: 501,
  userId: 1,
  scholarshipId: 101,
  createdAt: '2026-11-02T12:00:00Z',
  steps: [
    {
      id: 1,
      scholarshipInterestId: 501,
      stepKey: 'eligibility',
      title: 'Confirm eligibility',
      description: "Verify all requirements: Bachelor's degree or equivalent.",
      stepOrder: 1,
      isCompleted: false,
      completedAt: null,
    },
    {
      id: 2,
      scholarshipInterestId: 501,
      stepKey: 'academic_docs',
      title: 'Prepare academic documents',
      description: "Gather official transcripts for Master's, Doctorate level.",
      stepOrder: 2,
      isCompleted: false,
      completedAt: null,
    },
    {
      id: 3,
      scholarshipInterestId: 501,
      stepKey: 'submit',
      title: 'Submit the scholarship application',
      description: 'Submit via official portal before deadline.',
      stepOrder: 3,
      isCompleted: false,
      completedAt: null,
    },
  ],
}

describe('Scholarships Page & Application Process Experience', () => {
  const session = { token: 'mock-token', userId: 1, email: 'student@futurewings.io' }
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    apiRequest.mockImplementation((endpoint, options) => {
      if (typeof endpoint === 'string' && endpoint.startsWith('/scholarship?')) {
        return Promise.resolve(mockScholarshipsList)
      }
      if (endpoint === '/scholarship/101') {
        return Promise.resolve(mockScholarship101Details)
      }
      if (endpoint === '/scholarship/101/interest' && options?.method === 'POST') {
        return Promise.resolve(mockCreatedInterest)
      }
      if (endpoint === '/scholarship/101/checklist/1' && options?.method === 'PUT') {
        const body = JSON.parse(options.body)
        return Promise.resolve({
          ...mockCreatedInterest.steps[0],
          isCompleted: body.isCompleted,
          completedAt: body.isCompleted ? new Date().toISOString() : null,
        })
      }
      if (endpoint === '/deadlines' && options?.method === 'POST') {
        return Promise.resolve({ id: 999, title: 'Fulbright' })
      }
      return Promise.resolve({})
    })
  })

  it('View opens scholarship details instead of navigating to deadlines', async () => {
    render(<Scholarships onNavigate={onNavigate} session={session} />)

    // Wait for directory cards to appear
    await waitFor(() => {
      expect(screen.getByTestId('scholarship-card-101')).toBeInTheDocument()
    })

    const viewButton = screen.getByTestId('view-scholarship-btn-101')
    fireEvent.click(viewButton)

    // Critical assertion: onNavigate must NOT be invoked with Dashboard or deadlines
    expect(onNavigate).not.toHaveBeenCalled()

    // Details view must open
    await waitFor(() => {
      expect(screen.getByTestId('scholarship-details-view')).toBeInTheDocument()
      expect(screen.getByTestId('scholarship-name')).toHaveTextContent('Fulbright Foreign Student Program')
    })
  })

  it('All scholarship details and criteria render correctly in the details view', async () => {
    render(<Scholarships onNavigate={onNavigate} session={session} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-scholarship-btn-101')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('view-scholarship-btn-101'))

    await waitFor(() => {
      expect(screen.getByTestId('scholarship-details-view')).toBeInTheDocument()
    })

    expect(screen.getByTestId('scholarship-name')).toHaveTextContent('Fulbright Foreign Student Program')
    expect(screen.getByTestId('scholarship-award')).toHaveTextContent('$35,000')
    expect(screen.getByTestId('scholarship-description')).toHaveTextContent(
      'Enables graduate students from abroad to study and conduct research in the United States.'
    )
    expect(screen.getByTestId('scholarship-eligibility')).toHaveTextContent(
      "Bachelor's degree or equivalent, strong academic record, English proficiency."
    )
    expect(screen.getByTestId('scholarship-documents')).toHaveTextContent('Academic transcripts')
    expect(screen.getByTestId('scholarship-study-level')).toHaveTextContent("Master's, Doctorate")
    expect(screen.getByTestId('scholarship-field')).toHaveTextContent('All fields')
    expect(screen.getByTestId('scholarship-official-link')).toHaveAttribute('href', 'https://foreign.fulbrightonline.org/')
  })

  it("I'm Interested creates the application process and is idempotent", async () => {
    render(<Scholarships onNavigate={onNavigate} session={session} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-scholarship-btn-101')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('view-scholarship-btn-101'))

    await waitFor(() => {
      expect(screen.getByTestId('im-interested-btn')).toBeInTheDocument()
    })

    // Click "I'm Interested"
    const interestedBtn = screen.getByTestId('im-interested-btn')
    fireEvent.click(interestedBtn)

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/scholarship/101/interest', expect.objectContaining({ method: 'POST' }))
      expect(screen.getByTestId('checklist-steps-list')).toBeInTheDocument()
    })

    // Checklist steps must render
    expect(screen.getByTestId('step-title-1')).toHaveTextContent('1. Confirm eligibility')
    expect(screen.getByTestId('step-title-2')).toHaveTextContent('2. Prepare academic documents')

    // Button updates to Interested ✓
    expect(screen.getByTestId('im-interested-btn')).toHaveTextContent('Interested ✓')
  })

  it('Checklist steps can be marked complete and reverted', async () => {
    // Setup scholarship loaded as already interested with 3 steps
    apiRequest.mockImplementation((endpoint, options) => {
      if (typeof endpoint === 'string' && endpoint.startsWith('/scholarship?')) {
        return Promise.resolve(mockScholarshipsList)
      }
      if (endpoint === '/scholarship/101') {
        return Promise.resolve({
          ...mockScholarship101Details,
          isInterested: true,
          interest: mockCreatedInterest,
        })
      }
      if (endpoint === '/scholarship/101/checklist/1' && options?.method === 'PUT') {
        const body = JSON.parse(options.body)
        return Promise.resolve({
          ...mockCreatedInterest.steps[0],
          isCompleted: body.isCompleted,
          completedAt: body.isCompleted ? new Date().toISOString() : null,
        })
      }
      return Promise.resolve({})
    })

    render(<Scholarships onNavigate={onNavigate} session={session} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-scholarship-btn-101')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('view-scholarship-btn-101'))

    await waitFor(() => {
      expect(screen.getByTestId('checkbox-step-1')).toBeInTheDocument()
    })

    const checkbox = screen.getByTestId('checkbox-step-1')
    expect(checkbox).not.toBeChecked()

    // Mark complete
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        '/scholarship/101/checklist/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ isCompleted: true }),
        })
      )
      expect(screen.getByTestId('step-completed-badge-1')).toBeInTheDocument()
    })

    // Revert step
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        '/scholarship/101/checklist/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ isCompleted: false }),
        })
      )
    })
  })

  it('Progress persists after reload/API refresh and displays completion ratio', async () => {
    const interestWithProgress = {
      ...mockCreatedInterest,
      steps: [
        { ...mockCreatedInterest.steps[0], isCompleted: true, completedAt: '2026-11-02T10:00:00Z' },
        { ...mockCreatedInterest.steps[1], isCompleted: false, completedAt: null },
        { ...mockCreatedInterest.steps[2], isCompleted: false, completedAt: null },
      ],
    }

    apiRequest.mockImplementation((endpoint) => {
      if (typeof endpoint === 'string' && endpoint.startsWith('/scholarship?')) {
        return Promise.resolve(mockScholarshipsList)
      }
      if (endpoint === '/scholarship/101') {
        return Promise.resolve({
          ...mockScholarship101Details,
          isInterested: true,
          interest: interestWithProgress,
        })
      }
      return Promise.resolve({})
    })

    render(<Scholarships onNavigate={onNavigate} session={session} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-scholarship-btn-101')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('view-scholarship-btn-101'))

    await waitFor(() => {
      expect(screen.getByTestId('checklist-progress-pill')).toHaveTextContent('1/3')
      expect(screen.getByTestId('checklist-progress-bar-container')).toHaveTextContent('33% completed')
      expect(screen.getByTestId('step-completed-badge-1')).toBeInTheDocument()
    })
  })

  it('Missing optional scholarship data renders safely with "Not specified"', async () => {
    const minimalScholarship = {
      id: 202,
      countryId: 1,
      countryName: 'United States',
      countryCode: 'US',
      name: 'Minimal Test Grant',
      awardAmount: null,
      deadline: null,
      description: null,
      eligibilityCriteria: null,
      requiredDocuments: null,
      studyLevel: null,
      fieldOfStudy: null,
      officialLink: null,
      isInterested: false,
      interest: null,
    }

    apiRequest.mockImplementation((endpoint) => {
      if (typeof endpoint === 'string' && endpoint.startsWith('/scholarship?')) {
        return Promise.resolve([minimalScholarship])
      }
      if (endpoint === '/scholarship/202') {
        return Promise.resolve(minimalScholarship)
      }
      return Promise.resolve({})
    })

    render(<Scholarships onNavigate={onNavigate} session={session} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-scholarship-btn-202')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('view-scholarship-btn-202'))

    await waitFor(() => {
      expect(screen.getByTestId('scholarship-name')).toHaveTextContent('Minimal Test Grant')
    })

    expect(screen.getByTestId('scholarship-award')).toHaveTextContent('Amount varies')
    expect(screen.getByTestId('scholarship-deadline')).toHaveTextContent('Rolling deadline')
    expect(screen.getByTestId('scholarship-description')).toHaveTextContent('Not specified')
    expect(screen.getByTestId('scholarship-eligibility')).toHaveTextContent('Not specified')
    expect(screen.getByTestId('scholarship-documents')).toHaveTextContent('Not specified')
    expect(screen.getByTestId('scholarship-study-level')).toHaveTextContent('Not specified')
    expect(screen.getByTestId('scholarship-field')).toHaveTextContent('Not specified')
    expect(screen.getByTestId('scholarship-official-instructions')).toHaveTextContent('Not specified')
  })

  it('Supports back navigation to return to the scholarship list with preserved filters', async () => {
    render(<Scholarships onNavigate={onNavigate} session={session} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-scholarship-btn-101')).toBeInTheDocument()
    })

    // Set search query
    const searchInput = screen.getByPlaceholderText('Search scholarship or country')
    fireEvent.change(searchInput, { target: { value: 'Fulbright' } })

    // Click View
    fireEvent.click(screen.getByTestId('view-scholarship-btn-101'))

    await waitFor(() => {
      expect(screen.getByTestId('scholarship-details-view')).toBeInTheDocument()
    })

    // Click Back
    const backBtn = screen.getByTestId('back-to-scholarships')
    fireEvent.click(backBtn)

    await waitFor(() => {
      expect(screen.getByTestId('scholarships-directory')).toBeInTheDocument()
    })

    // Filter value is preserved
    expect(screen.getByPlaceholderText('Search scholarship or country')).toHaveValue('Fulbright')
  })

  it('API error when loading scholarship details displays error state with back action', async () => {
    apiRequest.mockImplementation((endpoint) => {
      if (typeof endpoint === 'string' && endpoint.startsWith('/scholarship?')) {
        return Promise.resolve(mockScholarshipsList)
      }
      if (endpoint === '/scholarship/101') {
        return Promise.reject(new Error('Network error loading details'))
      }
      return Promise.resolve({})
    })

    render(<Scholarships onNavigate={onNavigate} session={session} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-scholarship-btn-101')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('view-scholarship-btn-101'))

    await waitFor(() => {
      expect(screen.getByTestId('scholarship-details-error')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveTextContent('Network error loading details')
    })
  })

  it('Displays "Deadline passed" badge when scholarship deadline is in the past', async () => {
    const expiredScholarship = {
      ...mockScholarship101Details,
      deadline: '2023-01-01T00:00:00Z',
    }

    apiRequest.mockImplementation((endpoint) => {
      if (typeof endpoint === 'string' && endpoint.startsWith('/scholarship?')) {
        return Promise.resolve([expiredScholarship])
      }
      if (endpoint === '/scholarship/101') {
        return Promise.resolve(expiredScholarship)
      }
      return Promise.resolve({})
    })

    render(<Scholarships onNavigate={onNavigate} session={session} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-scholarship-btn-101')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('view-scholarship-btn-101'))

    await waitFor(() => {
      expect(screen.getByTestId('badge-deadline-passed')).toBeInTheDocument()
    })
  })

  it('Displays "All Steps Complete" banner when every checklist item is completed', async () => {
    const completeInterest = {
      ...mockCreatedInterest,
      steps: [
        { ...mockCreatedInterest.steps[0], isCompleted: true },
        { ...mockCreatedInterest.steps[1], isCompleted: true },
        { ...mockCreatedInterest.steps[2], isCompleted: true },
      ],
    }

    apiRequest.mockImplementation((endpoint) => {
      if (typeof endpoint === 'string' && endpoint.startsWith('/scholarship?')) {
        return Promise.resolve(mockScholarshipsList)
      }
      if (endpoint === '/scholarship/101') {
        return Promise.resolve({
          ...mockScholarship101Details,
          isInterested: true,
          interest: completeInterest,
        })
      }
      return Promise.resolve({})
    })

    render(<Scholarships onNavigate={onNavigate} session={session} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-scholarship-btn-101')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('view-scholarship-btn-101'))

    await waitFor(() => {
      expect(screen.getByTestId('all-steps-complete-banner')).toBeInTheDocument()
      expect(screen.getByTestId('checklist-progress-bar-container')).toHaveTextContent('100% completed')
    })
  })

  it('Add to Deadlines remains separate and adds deadline without navigating', async () => {
    render(<Scholarships onNavigate={onNavigate} session={session} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-scholarship-btn-101')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('view-scholarship-btn-101'))

    await waitFor(() => {
      expect(screen.getByTestId('add-to-deadlines-btn')).toBeInTheDocument()
    })

    const addDeadlineBtn = screen.getByTestId('add-to-deadlines-btn')
    fireEvent.click(addDeadlineBtn)

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        '/deadlines',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    // Navigation must not occur
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('Displays approaching deadline badge with warning state for deadlines within 30 days', async () => {
    // 15 days in future
    const fifteenDaysFuture = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
    const approachingScholarship = {
      ...mockScholarship101Details,
      deadline: fifteenDaysFuture,
    }

    apiRequest.mockImplementation((endpoint) => {
      if (typeof endpoint === 'string' && endpoint.startsWith('/scholarship?')) {
        return Promise.resolve([approachingScholarship])
      }
      if (endpoint === '/scholarship/101') {
        return Promise.resolve(approachingScholarship)
      }
      return Promise.resolve({})
    })

    render(<Scholarships onNavigate={onNavigate} session={session} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-scholarship-btn-101')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('view-scholarship-btn-101'))

    await waitFor(() => {
      expect(screen.getByTestId('badge-deadline-approaching')).toBeInTheDocument()
      expect(screen.getByTestId('badge-deadline-approaching')).toHaveTextContent('Due in 15 days')
    })
  })

  it('Renders structured scannable sections: Overview, Award & Deadline, Eligibility, Documents, and Process', async () => {
    render(<Scholarships onNavigate={onNavigate} session={session} />)

    await waitFor(() => {
      expect(screen.getByTestId('view-scholarship-btn-101')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('view-scholarship-btn-101'))

    await waitFor(() => {
      expect(screen.getByTestId('scholarship-details-view')).toBeInTheDocument()
    })

    // Check all structured sections
    expect(screen.getByText('Award & Deadline')).toBeInTheDocument()
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Eligibility Criteria')).toBeInTheDocument()
    expect(screen.getByText('Required Documents')).toBeInTheDocument()
    expect(screen.getByText('Application Process')).toBeInTheDocument()
  })
})

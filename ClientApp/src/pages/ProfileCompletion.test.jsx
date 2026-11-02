import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from '../App.jsx'
import Profile from './Profile.jsx'
import Recommendations from './Recommendations.jsx'
import Roadmap from './Roadmap.jsx'
import { apiRequest, loadSession } from '../auth.js'
import { clearProfilePromptDismissal } from '../lib/profileCompletion.js'

vi.mock('../auth.js', () => ({
  apiRequest: vi.fn(),
  loadSession: vi.fn(),
  saveSession: vi.fn(),
  clearSession: vi.fn(),
}))

describe('Student Profile Completion Onboarding Flow', () => {
  const studentSession = {
    userId: 101,
    token: 'jwt-student-token',
    email: 'newstudent@futurewings.io',
    firstName: 'Alex',
    lastName: 'Morgan',
    role: 'Student',
  }

  const adminSession = {
    userId: 900,
    token: 'jwt-admin-token',
    email: 'admin@futurewings.io',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'Admin',
  }

  const agentSession = {
    userId: 800,
    token: 'jwt-agent-token',
    email: 'agent@futurewings.io',
    firstName: 'Agent',
    lastName: 'Smith',
    role: 'Agent',
  }

  const incompleteProfile = {
    userId: 101,
    email: 'newstudent@futurewings.io',
    firstName: 'Alex',
    lastName: 'Morgan',
    cgpa: 3.5,
    major: null, // Missing
    budgetUsd: 0, // Incomplete (must be > 0)
    degreeLevel: '', // Missing
    isAcademicComplete: false,
    completedCoreFieldsCount: 1,
    totalRequiredCoreFieldsCount: 4,
    missingCoreFields: ['Target Major', 'Annual Budget', 'Target Degree Level'],
    completionPercentage: 25,
  }

  const completeProfile = {
    userId: 101,
    email: 'newstudent@futurewings.io',
    firstName: 'Alex',
    lastName: 'Morgan',
    cgpa: 3.85,
    major: 'Computer Science & AI',
    budgetUsd: 35000,
    degreeLevel: "Master's",
    isAcademicComplete: true,
    completedCoreFieldsCount: 4,
    totalRequiredCoreFieldsCount: 4,
    missingCoreFields: [],
    completionPercentage: 100,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    window.sessionStorage.clear()
    window.localStorage.clear()
    clearProfilePromptDismissal(101)
  })

  it('new student with incomplete profile sees the completion prompt after login with core field progress', async () => {
    loadSession.mockReturnValue(studentSession)
    apiRequest.mockImplementation((path) => {
      if (path === '/profile') return Promise.resolve(incompleteProfile)
      if (path === '/subscription/me') return Promise.resolve({ tier: 'Free', features: [] })
      if (path === '/deadline') return Promise.resolve([])
      if (path === '/discovery/saved') return Promise.resolve([])
      return Promise.resolve([])
    })

    render(<App />)

    // Prompt modal should appear
    await waitFor(() => {
      expect(screen.getByTestId('profile-completion-prompt-modal')).toBeInTheDocument()
    })

    const modal = screen.getByTestId('profile-completion-prompt-modal')
    expect(within(modal).getByText('Complete Your Academic Profile')).toBeInTheDocument()
    expect(within(modal).getByText(/1 of 4 core fields completed/i)).toBeInTheDocument()
    expect(within(modal).getByText(/unlock personalized recommendations, scholarship matches, and your application roadmap/i)).toBeInTheDocument()

    // Sidebar should show "Complete Your Profile" with progress before/instead of Tour
    expect(screen.getByTestId('sidebar-complete-profile-btn')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-profile-progress-pill')).toHaveTextContent('1/4')
  })

  it('admin and agent users are not forced to complete a student profile', async () => {
    loadSession.mockReturnValue(adminSession)
    apiRequest.mockImplementation((path) => {
      if (path === '/admin/dashboard') {
        return Promise.resolve({
          totalUsers: 0,
          activeApplications: 0,
          revenue: 0,
          recentApplications: [],
          upcomingDeadlines: [],
        })
      }
      if (path === '/admin/users' || path === '/admin/applications') return Promise.resolve([])
      if (path === '/admin/stats') return Promise.resolve({ totalUsers: 0, activeApplications: 0, revenue: 0 })
      if (path === '/admin/revenue') return Promise.resolve({ total: 0, byTier: {} })
      return Promise.resolve([])
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.queryByTestId('profile-completion-prompt-modal')).not.toBeInTheDocument()
      expect(screen.queryByTestId('sidebar-complete-profile-btn')).not.toBeInTheDocument()
    })
  })

  it('agent users are not forced into student profile onboarding', async () => {
    loadSession.mockReturnValue(agentSession)
    apiRequest.mockImplementation((path) => {
      if (path === '/agent/applicants') return Promise.resolve([])
      if (path === '/agent/stats') return Promise.resolve({ totalApplicants: 0 })
      return Promise.resolve([])
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.queryByTestId('profile-completion-prompt-modal')).not.toBeInTheDocument()
      expect(screen.queryByTestId('sidebar-complete-profile-btn')).not.toBeInTheDocument()
    })
  })

  it('skip displays warning toast, keeps reminder visible in workspace banner and sidebar', async () => {
    loadSession.mockReturnValue(studentSession)
    apiRequest.mockImplementation((path) => {
      if (path === '/profile') return Promise.resolve(incompleteProfile)
      if (path === '/subscription/me') return Promise.resolve({ tier: 'Free', features: [] })
      return Promise.resolve([])
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('profile-completion-prompt-modal')).toBeInTheDocument()
    })

    // Click "Skip for Now"
    fireEvent.click(screen.getByTestId('profile-prompt-skip-btn'))

    // Modal closes
    await waitFor(() => {
      expect(screen.queryByTestId('profile-completion-prompt-modal')).not.toBeInTheDocument()
    })

    // Visible warning banner in workspace remains
    const banner = screen.getByTestId('profile-incomplete-banner')
    expect(banner).toBeInTheDocument()
    expect(within(banner).getByText(/Your profile is incomplete/i)).toBeInTheDocument()

    // Sidebar action remains visible
    expect(screen.getByTestId('sidebar-complete-profile-btn')).toBeInTheDocument()
  })

  it('complete profile shows normal Take Product Tour action in sidebar', async () => {
    loadSession.mockReturnValue(studentSession)
    apiRequest.mockImplementation((path) => {
      if (path === '/profile') return Promise.resolve(completeProfile)
      if (path === '/subscription/me') return Promise.resolve({ tier: 'Free', features: [] })
      return Promise.resolve([])
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.queryByTestId('profile-completion-prompt-modal')).not.toBeInTheDocument()
      expect(screen.getByTestId('sidebar-take-tour-btn')).toBeInTheDocument()
      expect(screen.queryByTestId('sidebar-complete-profile-btn')).not.toBeInTheDocument()
    })
  })

  it('Profile page marks required fields, shows inline validation errors, and prevents saving invalid data', async () => {
    apiRequest.mockImplementation((path) => {
      if (path === '/profile') return Promise.resolve(incompleteProfile)
      return Promise.resolve({})
    })

    render(<Profile onProfileUpdate={vi.fn()} session={studentSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('input-firstName')).toHaveValue('Alex')
    })

    // Set invalid CGPA and invalid budget
    fireEvent.change(screen.getByTestId('input-cgpa'), { target: { value: '5.0' } })
    fireEvent.change(screen.getByTestId('input-budgetUsd'), { target: { value: '-200' } })

    // Attempt save
    fireEvent.click(screen.getByTestId('save-profile-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('error-cgpa')).toHaveTextContent(/0.0 and 4.0/i)
      expect(screen.getByTestId('error-budgetUsd')).toHaveTextContent(/greater than \$0/i)
      expect(screen.getByTestId('profile-error-alert')).toBeInTheDocument()
    })

    // Preserves entered values
    expect(screen.getByTestId('input-cgpa')).toHaveValue(5)
    expect(screen.getByTestId('input-budgetUsd')).toHaveValue(-200)

    // API PUT was not called due to validation failure
    expect(apiRequest).not.toHaveBeenCalledWith('/profile', expect.objectContaining({ method: 'PUT' }))
  })

  it('saving a complete profile updates completion to 4 of 4 and displays success confirmation', async () => {
    const onProfileUpdate = vi.fn()
    apiRequest.mockImplementation((path, options) => {
      if (path === '/profile' && options?.method === 'PUT') {
        return Promise.resolve(completeProfile)
      }
      if (path === '/profile') return Promise.resolve(incompleteProfile)
      return Promise.resolve({})
    })

    render(<Profile onProfileUpdate={onProfileUpdate} session={studentSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('input-firstName')).toHaveValue('Alex')
    })

    // Fill valid values
    fireEvent.change(screen.getByTestId('input-cgpa'), { target: { value: '3.85' } })
    fireEvent.change(screen.getByTestId('input-major'), { target: { value: 'Computer Science & AI' } })
    fireEvent.change(screen.getByTestId('input-budgetUsd'), { target: { value: '35000' } })
    fireEvent.change(screen.getByTestId('select-degreeLevel'), { target: { value: "Master's" } })

    fireEvent.click(screen.getByTestId('save-profile-btn'))

    await waitFor(() => {
      expect(screen.getByText(/Profile updated successfully! Your academic profile is now complete/i)).toBeInTheDocument()
      expect(screen.getByTestId('profile-core-fields-badge')).toHaveTextContent('4 of 4 Core Fields Completed')
      expect(onProfileUpdate).toHaveBeenCalledWith(completeProfile)
    })
  })

  it('Recommendations page displays incomplete-profile state when core fields are missing', async () => {
    apiRequest.mockImplementation((path) => {
      if (path === '/profile') return Promise.resolve(incompleteProfile)
      if (path === '/recommendation') return Promise.resolve([])
      return Promise.resolve([])
    })

    const onNavigate = vi.fn()
    render(<Recommendations onNavigate={onNavigate} session={studentSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('recommendations-incomplete-state')).toBeInTheDocument()
      expect(screen.getByText(/Profile Completion Required/i)).toBeInTheDocument()
      expect(screen.getByText(/Missing: Target Major, Annual Budget, Target Degree Level/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('recommendations-go-to-profile-btn'))
    expect(onNavigate).toHaveBeenCalledWith('Profile')
  })

  it('Roadmap page displays incomplete profile banner when core fields are missing', async () => {
    apiRequest.mockImplementation((path) => {
      if (path === '/profile') return Promise.resolve(incompleteProfile)
      if (path === '/discovery') return Promise.resolve({ programs: [] })
      return Promise.resolve([])
    })

    const onNavigate = vi.fn()
    render(<Roadmap onNavigate={onNavigate} session={studentSession} />)

    await waitFor(() => {
      expect(screen.getByTestId('roadmap-incomplete-banner')).toBeInTheDocument()
      expect(screen.getByText(/Profile incomplete/i)).toBeInTheDocument()
      expect(screen.getByText(/Missing: Target Major, Annual Budget, Target Degree Level/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('roadmap-go-to-profile-btn'))
    expect(onNavigate).toHaveBeenCalledWith('Profile')
  })
})

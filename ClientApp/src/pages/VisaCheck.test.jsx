import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VisaCheck from './VisaCheck.jsx'
import * as auth from '../auth.js'

describe('VisaCheck Feature & Step Navigation', () => {
  const mockSession = {
    token: 'test-jwt-token',
    id: 1,
    email: 'student@example.com',
    role: 'Student',
  }

  const mockApplications = [
    {
      applicationId: '10',
      programId: 101,
      programName: 'MSc Computer Science',
      universityName: 'University of Toronto',
      status: 'Submitted',
    },
  ]

  const mockPrograms = [
    {
      id: 101,
      name: 'MSc Computer Science',
      country: 'Canada',
      level: "Master's",
      annualTuitionUsd: 28000,
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()

    vi.spyOn(auth, 'apiRequest').mockImplementation((path, options) => {
      if (path === '/applications') {
        return Promise.resolve(mockApplications)
      }
      if (path === '/discovery') {
        return Promise.resolve({ programs: mockPrograms })
      }
      if (path === '/visa/evaluate' && options?.method === 'POST') {
        return Promise.resolve({
          riskLevel: 'Low',
          riskScore: 24,
          reasons: ['Check destination living requirements verified'],
          recommendations: ['Maintain required liquid funds across 6 months'],
        })
      }
      if (path?.startsWith('/visa/application/')) {
        return Promise.resolve({
          riskLevel: 'Low',
          riskScore: 20,
          reasons: ['Strong academic preparation'],
          recommendations: ['Submit proof of financial guarantee'],
        })
      }
      return Promise.resolve({})
    })
  })

  it('renders the Continue button with clean Unicode arrow "Continue →" and no literal &rarr; in the DOM', async () => {
    const { container } = await act(async () => {
      return render(<VisaCheck session={mockSession} />)
    })

    const continueBtn = screen.getByRole('button', { name: /continue/i })
    expect(continueBtn).toBeInTheDocument()

    // Verify text content shows Continue →
    expect(continueBtn.textContent).toBe('Continue →')

    // Verify the literal string "&rarr;" is NOT in the rendered DOM
    expect(container.innerHTML).not.toContain('&rarr;')
    expect(screen.queryByText(/&rarr;/i)).toBeNull()
  })

  it('prevents advancing to the next step when required Destination Country is missing', async () => {
    await act(async () => {
      render(<VisaCheck session={mockSession} />)
    })

    // Step 1: Destination Country is initially empty
    const countryInput = screen.getByLabelText(/destination country/i)
    expect(countryInput.value).toBe('')

    // Attempt to submit form without filling required country
    const form = countryInput.closest('form')
    await act(async () => {
      fireEvent.submit(form)
    })

    // Should still be on Step 1 with error alert
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    expect(screen.getByText('Study Plan Details')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/please provide a destination country/i)
  })

  it('advances to next step when required fields are provided', async () => {
    await act(async () => {
      render(<VisaCheck session={mockSession} />)
    })

    // Fill Destination Country
    const countryInput = screen.getByLabelText(/destination country/i)
    await act(async () => {
      fireEvent.change(countryInput, { target: { value: 'United Kingdom' } })
    })

    const form = countryInput.closest('form')
    await act(async () => {
      fireEvent.submit(form)
    })

    // Advances to Step 2 (Funding)
    await waitFor(() => {
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
      expect(screen.getByText('Funding Details')).toBeInTheDocument()
    })

    // Verify Previous Step button is now enabled
    const prevBtn = screen.getByRole('button', { name: /previous step/i })
    expect(prevBtn).not.toBeDisabled()

    // Clicking Previous Step returns to Step 1
    await act(async () => {
      fireEvent.click(prevBtn)
    })
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
  })

  it('completes multi-step wizard and allows starting over', async () => {
    const apiSpy = vi.spyOn(auth, 'apiRequest')

    await act(async () => {
      render(<VisaCheck session={mockSession} />)
    })

    const countryInput = screen.getByLabelText(/destination country/i)
    const form = countryInput.closest('form')

    // Step 1 -> Step 2
    await act(async () => {
      fireEvent.change(countryInput, { target: { value: 'Germany' } })
      fireEvent.submit(form)
    })

    // Step 2 -> Step 3
    await waitFor(() => {
      expect(screen.getByText('Funding Details')).toBeInTheDocument()
    })
    await act(async () => {
      fireEvent.submit(form)
    })

    // Step 3 -> Step 4
    await waitFor(() => {
      expect(screen.getByText('Language Details')).toBeInTheDocument()
    })
    await act(async () => {
      fireEvent.submit(form)
    })

    // Step 4 (Final Step)
    await waitFor(() => {
      expect(screen.getByText('Visa History Details')).toBeInTheDocument()
    })

    // Button label on final step
    const calculateBtn = screen.getByRole('button', { name: /calculate visa readiness/i })
    expect(calculateBtn).toBeInTheDocument()
    expect(calculateBtn.textContent).toBe('Calculate Visa Readiness')

    // Submit assessment
    await act(async () => {
      fireEvent.submit(form)
    })

    expect(apiSpy).toHaveBeenCalledWith(
      '/visa/evaluate',
      expect.objectContaining({ method: 'POST' })
    )

    // Result card is populated
    await waitFor(() => {
      expect(screen.getByText(/readiness risk analysis/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start over/i })).toBeInTheDocument()
    })

    // Clicking Start Over resets back to step 1
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /start over/i }))
    })
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
  })

  it('preserves accessible button attributes and decorative arrow styling', async () => {
    const { container } = await act(async () => {
      return render(<VisaCheck session={mockSession} />)
    })

    const continueBtn = screen.getByRole('button', { name: /continue/i })
    expect(continueBtn.tagName).toBe('BUTTON')
    expect(continueBtn).toHaveAttribute('type', 'submit')

    // Arrow is decorative with aria-hidden="true"
    const arrowSpan = continueBtn.querySelector('span[aria-hidden="true"]')
    expect(arrowSpan).toBeInTheDocument()
    expect(arrowSpan.textContent).toBe('→')

    // Check that no &rarr; is present anywhere in container
    expect(container.innerHTML).not.toContain('&rarr;')
  })
})

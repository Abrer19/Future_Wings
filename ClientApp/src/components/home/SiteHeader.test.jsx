import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SiteHeader from './SiteHeader.jsx'
import Home from '../../pages/Home.jsx'
import App from '../../App.jsx'
import { getReturnTo, clearReturnTo } from '../../lib/navigationStorage.js'
import { authenticate, loadSession } from '../../auth.js'

vi.mock('../../auth.js', () => ({
  authenticate: vi.fn(),
  loadSession: vi.fn(() => null),
  saveSession: vi.fn(),
  clearSession: vi.fn(),
  apiRequest: vi.fn(() => Promise.resolve({})),
}))

vi.mock('../../lib/onboardingStorage.js', () => ({
  isTourEligible: vi.fn(() => false),
  isProfilePromptDismissed: vi.fn(() => true),
  resetTourRecord: vi.fn(),
  dismissProfilePrompt: vi.fn(),
}))

describe('Public Homepage Navbar Navigation (SiteHeader & Home)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearReturnTo()
    window.location.hash = ''
  })

  describe('SiteHeader Component Tests', () => {
    it('Unauthenticated Scholarship click navigates to Login and preserves destination', () => {
      const onNavigate = vi.fn()
      render(<SiteHeader isAuthenticated={false} onNavigate={onNavigate} />)

      const scholarshipBtn = screen.getByRole('button', { name: /^Scholarships$/i })
      expect(scholarshipBtn).toBeInTheDocument()
      expect(scholarshipBtn).toHaveAttribute('type', 'button')

      fireEvent.click(scholarshipBtn)

      expect(onNavigate).toHaveBeenCalledTimes(1)
      expect(onNavigate).toHaveBeenCalledWith('Login')
      expect(getReturnTo()).toBe('Scholarships')
    })

    it('Unauthenticated Community click navigates to Login and preserves destination', () => {
      const onNavigate = vi.fn()
      render(<SiteHeader isAuthenticated={false} onNavigate={onNavigate} />)

      const communityBtn = screen.getByRole('button', { name: /^Community$/i })
      expect(communityBtn).toBeInTheDocument()
      expect(communityBtn).toHaveAttribute('type', 'button')

      fireEvent.click(communityBtn)

      expect(onNavigate).toHaveBeenCalledTimes(1)
      expect(onNavigate).toHaveBeenCalledWith('Login')
      expect(getReturnTo()).toBe('Community')
    })

    it('Authenticated Scholarship click navigates to Scholarships', () => {
      const onNavigate = vi.fn()
      render(<SiteHeader isAuthenticated={true} onNavigate={onNavigate} />)

      const scholarshipBtn = screen.getByRole('button', { name: /^Scholarships$/i })
      fireEvent.click(scholarshipBtn)

      expect(onNavigate).toHaveBeenCalledTimes(1)
      expect(onNavigate).toHaveBeenCalledWith('Scholarships')
    })

    it('Authenticated Community click navigates to Community', () => {
      const onNavigate = vi.fn()
      render(<SiteHeader isAuthenticated={true} onNavigate={onNavigate} />)

      const communityBtn = screen.getByRole('button', { name: /^Community$/i })
      fireEvent.click(communityBtn)

      expect(onNavigate).toHaveBeenCalledTimes(1)
      expect(onNavigate).toHaveBeenCalledWith('Community')
    })

    it('Existing public navbar links remain unchanged', () => {
      render(<SiteHeader />)

      const productLink = screen.getByRole('link', { name: /^Product$/i })
      expect(productLink).toBeInTheDocument()
      expect(productLink).toHaveAttribute('href', '#product')

      const howItWorksLink = screen.getByRole('link', { name: /^How It Works$/i })
      expect(howItWorksLink).toBeInTheDocument()
      expect(howItWorksLink).toHaveAttribute('href', '#how-it-works')

      const destinationsLink = screen.getByRole('link', { name: /^Destinations$/i })
      expect(destinationsLink).toBeInTheDocument()
      expect(destinationsLink).toHaveAttribute('href', '#destinations')

      const faqLink = screen.getByRole('link', { name: /^FAQ$/i })
      expect(faqLink).toBeInTheDocument()
      expect(faqLink).toHaveAttribute('href', '#faq')

      const logoLink = screen.getByRole('link', { name: /FutureWings AI/i })
      expect(logoLink).toBeInTheDocument()
      expect(logoLink).toHaveAttribute('href', '#home')
    })

    it('Existing Sign In and Sign Up buttons function normally', () => {
      const onSignIn = vi.fn()
      const onSignUp = vi.fn()
      render(<SiteHeader onSignIn={onSignIn} onSignUp={onSignUp} />)

      const signInBtn = screen.getByRole('button', { name: /^Sign In$/i })
      fireEvent.click(signInBtn)
      expect(onSignIn).toHaveBeenCalledTimes(1)

      const signUpBtn = screen.getByRole('button', { name: /Get Started/i })
      fireEvent.click(signUpBtn)
      expect(onSignUp).toHaveBeenCalledTimes(1)
    })

    it('Unauthenticated click without onNavigate falls back to onSignIn', () => {
      const onSignIn = vi.fn()
      render(<SiteHeader isAuthenticated={false} onSignIn={onSignIn} />)

      const scholarshipBtn = screen.getByRole('button', { name: /^Scholarships$/i })
      fireEvent.click(scholarshipBtn)

      expect(onSignIn).toHaveBeenCalledTimes(1)
      expect(getReturnTo()).toBe('Scholarships')
    })

    it('Mobile drawer opens, allows keyboard/click navigation, and closes on item click', () => {
      const onNavigate = vi.fn()
      render(<SiteHeader isAuthenticated={false} onNavigate={onNavigate} />)

      // Open mobile drawer
      const menuBtn = screen.getByLabelText(/Open mobile navigation menu/i)
      fireEvent.click(menuBtn)

      // Both desktop and mobile items are present
      const scholarshipBtns = screen.getAllByRole('button', { name: /^Scholarships$/i })
      expect(scholarshipBtns.length).toBe(2)

      // Click mobile drawer Scholarships button (the second one)
      fireEvent.click(scholarshipBtns[1])

      expect(onNavigate).toHaveBeenCalledWith('Login')
      expect(getReturnTo()).toBe('Scholarships')

      // Drawer should now be closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Home Page Integration Tests', () => {
    it('Unauthenticated Scholarship click from Home page navigates to Login', () => {
      const onNavigate = vi.fn()
      render(<Home isAuthenticated={false} onNavigate={onNavigate} />)

      const scholarshipBtn = screen.getByRole('button', { name: /^Scholarships$/i })
      fireEvent.click(scholarshipBtn)

      expect(onNavigate).toHaveBeenCalledWith('Login')
      expect(getReturnTo()).toBe('Scholarships')
    })

    it('Unauthenticated Community click from Home page navigates to Login', () => {
      const onNavigate = vi.fn()
      render(<Home isAuthenticated={false} onNavigate={onNavigate} />)

      const communityBtn = screen.getByRole('button', { name: /^Community$/i })
      fireEvent.click(communityBtn)

      expect(onNavigate).toHaveBeenCalledWith('Login')
      expect(getReturnTo()).toBe('Community')
    })

    it('Authenticated Scholarship click from Home page navigates to Scholarships', () => {
      const onNavigate = vi.fn()
      render(<Home isAuthenticated={true} onNavigate={onNavigate} />)

      const scholarshipBtn = screen.getByRole('button', { name: /^Scholarships$/i })
      fireEvent.click(scholarshipBtn)

      expect(onNavigate).toHaveBeenCalledWith('Scholarships')
    })

    it('Authenticated Community click from Home page navigates to Community', () => {
      const onNavigate = vi.fn()
      render(<Home isAuthenticated={true} onNavigate={onNavigate} />)

      const communityBtn = screen.getByRole('button', { name: /^Community$/i })
      fireEvent.click(communityBtn)

      expect(onNavigate).toHaveBeenCalledWith('Community')
    })
  })

  describe('Full App Integration & Return Navigation Flow', () => {
    it('Unauthenticated user clicking Scholarships in App navbar navigates to Login, then to Scholarships after login', async () => {
      loadSession.mockReturnValue(null)
      window.location.hash = '#/home'
      render(<App />)

      // In public navbar, click Scholarships
      const scholarshipBtn = screen.getByRole('button', { name: /^Scholarships$/i })
      fireEvent.click(scholarshipBtn)

      // URL hash updates to #/login and Login card is displayed
      await waitFor(() => {
        expect(window.location.hash).toBe('#/login')
        expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
      })
      expect(getReturnTo()).toBe('Scholarships')

      // Authenticate with valid student credentials
      const studentSession = {
        userId: 101,
        token: 'jwt-123',
        role: 'Student',
        email: 'student@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
      }
      authenticate.mockResolvedValueOnce(studentSession)

      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'student@example.com' } })
      fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Password123!' } })
      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

      // After login, returnTo ('Scholarships') is honored
      await waitFor(() => {
        expect(window.location.hash).toBe('#/scholarships')
        expect(getReturnTo()).toBeNull()
      })
    })

    it('Unauthenticated user clicking Community in App navbar navigates to Login, then to Community after login', async () => {
      loadSession.mockReturnValue(null)
      window.location.hash = '#/home'
      render(<App />)

      // In public navbar, click Community
      const communityBtn = screen.getByRole('button', { name: /^Community$/i })
      fireEvent.click(communityBtn)

      // URL hash updates to #/login and Login card is displayed
      await waitFor(() => {
        expect(window.location.hash).toBe('#/login')
        expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
      })
      expect(getReturnTo()).toBe('Community')

      // Authenticate
      const studentSession = {
        userId: 102,
        token: 'jwt-456',
        role: 'Student',
        email: 'student2@example.com',
        firstName: 'John',
        lastName: 'Smith',
      }
      authenticate.mockResolvedValueOnce(studentSession)

      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'student2@example.com' } })
      fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Password123!' } })
      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

      // After login, returnTo ('Community') is honored
      await waitFor(() => {
        expect(window.location.hash).toBe('#/community')
        expect(getReturnTo()).toBeNull()
      })
    })

    it('Authenticated student on Home page clicking Scholarships navigates directly to Scholarships workspace', async () => {
      loadSession.mockReturnValue({
        userId: 101,
        token: 'jwt-student',
        role: 'Student',
        email: 'student@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
      })
      window.location.hash = '#/home'
      render(<App />)

      const scholarshipBtn = screen.getByRole('button', { name: /^Scholarships$/i })
      fireEvent.click(scholarshipBtn)

      await waitFor(() => {
        expect(window.location.hash).toBe('#/scholarships')
      })
    })

    it('Authenticated student on Home page clicking Community navigates directly to Community workspace', async () => {
      loadSession.mockReturnValue({
        userId: 101,
        token: 'jwt-student',
        role: 'Student',
        email: 'student@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
      })
      window.location.hash = '#/home'
      render(<App />)

      const communityBtn = screen.getByRole('button', { name: /^Community$/i })
      fireEvent.click(communityBtn)

      await waitFor(() => {
        expect(window.location.hash).toBe('#/community')
      })
    })
  })
})

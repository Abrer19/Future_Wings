import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from './Login.jsx'
import Register from './Register.jsx'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import App from '../App.jsx'
import { authenticate } from '../auth.js'

vi.mock('../auth.js', () => ({
  authenticate: vi.fn(),
  loadSession: vi.fn(() => null),
  clearSession: vi.fn(),
  apiRequest: vi.fn(() => Promise.resolve({})),
}))

vi.mock('../lib/onboardingStorage.js', () => ({
  isTourEligible: vi.fn(() => false),
  isProfilePromptDismissed: vi.fn(() => true),
  resetTourRecord: vi.fn(),
  dismissProfilePrompt: vi.fn(),
}))

describe('Auth Pages - Back to Homepage & Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.hash = ''
  })

  describe('Login Page', () => {
    it('renders a visible and accessible "Back to Homepage" button', () => {
      render(<Login onAuthenticated={vi.fn()} onNavigate={vi.fn()} />)

      const backBtn = screen.getByRole('button', { name: /Back to Homepage/i })
      expect(backBtn).toBeInTheDocument()
      expect(backBtn).toHaveAttribute('type', 'button')
      expect(backBtn).toHaveAttribute('aria-label', 'Back to Homepage')
      expect(backBtn).toHaveTextContent('Back to Homepage')
    })

    it('clicking "Back to Homepage" invokes navigation with "Home"', () => {
      const onNavigateMock = vi.fn()
      render(<Login onAuthenticated={vi.fn()} onNavigate={onNavigateMock} />)

      const backBtn = screen.getByRole('button', { name: /Back to Homepage/i })
      fireEvent.click(backBtn)

      expect(onNavigateMock).toHaveBeenCalledTimes(1)
      expect(onNavigateMock).toHaveBeenCalledWith('Home')
    })

    it('clicking "Back to Homepage" uses dedicated onBackToHome if provided', () => {
      const onBackToHomeMock = vi.fn()
      const onNavigateMock = vi.fn()
      render(
        <Login
          onAuthenticated={vi.fn()}
          onBackToHome={onBackToHomeMock}
          onNavigate={onNavigateMock}
        />,
      )

      const backBtn = screen.getByRole('button', { name: /Back to Homepage/i })
      fireEvent.click(backBtn)

      expect(onBackToHomeMock).toHaveBeenCalledTimes(1)
      expect(onNavigateMock).not.toHaveBeenCalled()
    })

    it('clicking "Create an account" invokes navigation to Register', () => {
      const onNavigateMock = vi.fn()
      render(<Login onAuthenticated={vi.fn()} onNavigate={onNavigateMock} />)

      const switchBtn = screen.getByRole('button', { name: /Create an account/i })
      expect(switchBtn).toBeInTheDocument()

      fireEvent.click(switchBtn)
      expect(onNavigateMock).toHaveBeenCalledTimes(1)
      expect(onNavigateMock).toHaveBeenCalledWith('Register')
    })

    it('submitting login form with valid credentials invokes authenticate and onAuthenticated', async () => {
      const onAuthMock = vi.fn()
      const mockUser = { token: 'jwt-123', userId: 1, role: 'Student' }
      authenticate.mockResolvedValueOnce(mockUser)

      render(<Login onAuthenticated={onAuthMock} onNavigate={vi.fn()} />)

      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'user@example.com' } })
      fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Password123!' } })

      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

      await waitFor(() => {
        expect(authenticate).toHaveBeenCalledWith('login', {
          email: 'user@example.com',
          password: 'Password123!',
        })
        expect(onAuthMock).toHaveBeenCalledWith(mockUser)
      })
    })

    it('displays error message when login fails and leaves form intact', async () => {
      authenticate.mockRejectedValueOnce(new Error('Invalid email or password.'))

      render(<Login onAuthenticated={vi.fn()} onNavigate={vi.fn()} />)

      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'wrong@example.com' } })
      fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'WrongPass' } })

      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password.')).toBeInTheDocument()
      })
    })
  })

  describe('Register Page', () => {
    it('renders a visible and accessible "Back to Homepage" button', () => {
      render(<Register onAuthenticated={vi.fn()} onNavigate={vi.fn()} />)

      const backBtn = screen.getByRole('button', { name: /Back to Homepage/i })
      expect(backBtn).toBeInTheDocument()
      expect(backBtn).toHaveAttribute('type', 'button')
      expect(backBtn).toHaveAttribute('aria-label', 'Back to Homepage')
      expect(backBtn).toHaveTextContent('Back to Homepage')
    })

    it('clicking "Back to Homepage" invokes navigation with "Home"', () => {
      const onNavigateMock = vi.fn()
      render(<Register onAuthenticated={vi.fn()} onNavigate={onNavigateMock} />)

      const backBtn = screen.getByRole('button', { name: /Back to Homepage/i })
      fireEvent.click(backBtn)

      expect(onNavigateMock).toHaveBeenCalledTimes(1)
      expect(onNavigateMock).toHaveBeenCalledWith('Home')
    })

    it('clicking "Back to Homepage" uses dedicated onBackToHome if provided', () => {
      const onBackToHomeMock = vi.fn()
      const onNavigateMock = vi.fn()
      render(
        <Register
          onAuthenticated={vi.fn()}
          onBackToHome={onBackToHomeMock}
          onNavigate={onNavigateMock}
        />,
      )

      const backBtn = screen.getByRole('button', { name: /Back to Homepage/i })
      fireEvent.click(backBtn)

      expect(onBackToHomeMock).toHaveBeenCalledTimes(1)
      expect(onNavigateMock).not.toHaveBeenCalled()
    })

    it('clicking "Sign in" invokes navigation to Login', () => {
      const onNavigateMock = vi.fn()
      render(<Register onAuthenticated={vi.fn()} onNavigate={onNavigateMock} />)

      const switchBtn = screen.getByRole('button', { name: /Sign in/i })
      expect(switchBtn).toBeInTheDocument()

      fireEvent.click(switchBtn)
      expect(onNavigateMock).toHaveBeenCalledTimes(1)
      expect(onNavigateMock).toHaveBeenCalledWith('Login')
    })

    it('validates password matching before submitting registration', async () => {
      render(<Register onAuthenticated={vi.fn()} onNavigate={vi.fn()} />)

      fireEvent.change(screen.getByLabelText(/^First name/i), { target: { value: 'Alex' } })
      fireEvent.change(screen.getByLabelText(/^Last name/i), { target: { value: 'Smith' } })
      fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'alex@example.com' } })
      fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirm password/i), { target: { value: 'Mismatch999!' } })

      fireEvent.click(screen.getByRole('button', { name: /Create account/i }))

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
        expect(authenticate).not.toHaveBeenCalled()
      })
    })

    it('submitting registration form with valid matching passwords calls authenticate and onAuthenticated', async () => {
      const onAuthMock = vi.fn()
      const mockUser = { token: 'jwt-456', userId: 2, role: 'Student' }
      authenticate.mockResolvedValueOnce(mockUser)

      render(<Register onAuthenticated={onAuthMock} onNavigate={vi.fn()} />)

      fireEvent.change(screen.getByLabelText(/^First name/i), { target: { value: 'Alex' } })
      fireEvent.change(screen.getByLabelText(/^Last name/i), { target: { value: 'Smith' } })
      fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'alex@example.com' } })
      fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirm password/i), { target: { value: 'Password123!' } })

      fireEvent.click(screen.getByRole('button', { name: /Create account/i }))

      await waitFor(() => {
        expect(authenticate).toHaveBeenCalledWith('register', {
          firstName: 'Alex',
          lastName: 'Smith',
          email: 'alex@example.com',
          password: 'Password123!',
        })
        expect(onAuthMock).toHaveBeenCalledWith(mockUser)
      })
    })
  })

  describe('AuthLayout Shared Component', () => {
    it('renders Back to Homepage button when onBackToHome is provided and triggers callback', () => {
      const backMock = vi.fn()
      render(
        <AuthLayout
          onBackToHome={backMock}
          subtitle="Subtitle text"
          title="Title text"
        >
          <p>Children content</p>
        </AuthLayout>,
      )

      expect(screen.getByText('Title text')).toBeInTheDocument()
      expect(screen.getByText('Subtitle text')).toBeInTheDocument()
      expect(screen.getByText('Children content')).toBeInTheDocument()

      const backBtn = screen.getByRole('button', { name: /Back to Homepage/i })
      expect(backBtn).toBeInTheDocument()
      fireEvent.click(backBtn)
      expect(backMock).toHaveBeenCalledTimes(1)
    })

    it('does not render back button when onBackToHome is omitted', () => {
      render(
        <AuthLayout
          subtitle="Subtitle text"
          title="Title text"
        >
          <p>Children content</p>
        </AuthLayout>,
      )

      expect(screen.queryByRole('button', { name: /Back to Homepage/i })).not.toBeInTheDocument()
    })
  })

  describe('Full App Integration - Back to Homepage & Switch Flow', () => {
    it('returns to public Home page from Login when Back to Homepage is clicked and updates hash', async () => {
      window.location.hash = '#/login'
      render(<App />)

      // Confirm on Login page
      expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
      const backBtn = screen.getByRole('button', { name: /Back to Homepage/i })
      expect(backBtn).toBeInTheDocument()

      // Click Back to Homepage
      fireEvent.click(backBtn)

      // Confirm returned to public Home landing page
      await waitFor(() => {
        expect(window.location.hash).toBe('#/home')
        expect(screen.getAllByRole('button', { name: /Sign In/i }).length).toBeGreaterThan(0)
        expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument()
      })
    })

    it('returns to public Home page from Register when Back to Homepage is clicked and updates hash', async () => {
      window.location.hash = '#/register'
      render(<App />)

      // Confirm on Register page
      expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
      const backBtn = screen.getByRole('button', { name: /Back to Homepage/i })
      expect(backBtn).toBeInTheDocument()

      // Click Back to Homepage
      fireEvent.click(backBtn)

      // Confirm returned to public Home landing page
      await waitFor(() => {
        expect(window.location.hash).toBe('#/home')
        expect(screen.getAllByRole('button', { name: /Sign In/i }).length).toBeGreaterThan(0)
        expect(screen.queryByRole('heading', { name: 'Create your account' })).not.toBeInTheDocument()
      })
    })

    it('switches between Login and Register smoothly in App', async () => {
      window.location.hash = '#/login'
      render(<App />)

      expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()

      // Click Create an account
      fireEvent.click(screen.getByRole('button', { name: /Create an account/i }))

      await waitFor(() => {
        expect(window.location.hash).toBe('#/register')
        expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
      })

      // Click Sign in on Register card
      fireEvent.click(screen.getByRole('button', { name: /^Sign in$/i }))

      await waitFor(() => {
        expect(window.location.hash).toBe('#/login')
        expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
      })
    })
  })
})

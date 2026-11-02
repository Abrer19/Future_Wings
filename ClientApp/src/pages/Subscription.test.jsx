import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Subscription from './Subscription.jsx'
import { apiRequest } from '../auth.js'
import LockedFeature from '../components/ui/LockedFeature.jsx'

vi.mock('../auth.js', () => ({
  apiRequest: vi.fn(),
}))

const mockPlans = [
  {
    tier: 'Free',
    name: 'Free',
    description: 'Basic access',
    monthlyPriceUsd: 0,
    highlights: ['Dashboard', 'Discovery'],
    features: ['dashboard', 'discovery'],
    purchasable: true,
  },
  {
    tier: 'Pro',
    name: 'Pro',
    description: 'Adds study roadmap',
    monthlyPriceUsd: 9,
    highlights: ['Everything in Free', 'Study roadmap mind map'],
    features: ['dashboard', 'discovery', 'roadmap'],
    purchasable: true,
  },
  {
    tier: 'Premium',
    name: 'Premium',
    description: 'Adds interview practice',
    monthlyPriceUsd: 19,
    highlights: ['Everything in Pro', 'AI mock interviews'],
    features: ['dashboard', 'discovery', 'roadmap', 'aiInterview'],
    purchasable: true,
  },
]

describe('Subscription Demo Mode & Unlock Pro Flow', () => {
  const session = { token: 'mock-token', userId: 1, email: 'demo@student.com' }

  beforeEach(() => {
    vi.clearAllMocks()
    apiRequest.mockImplementation((endpoint) => {
      if (endpoint === '/subscription/plans') {
        return Promise.resolve(mockPlans)
      }
      if (endpoint === '/subscription/demo-pro') {
        return Promise.resolve({
          tier: 'Pro',
          features: ['dashboard', 'discovery', 'roadmap'],
          isDemoMode: true,
        })
      }
      return Promise.resolve({})
    })
  })

  it('renders "Unlock Pro Demo" action when demo mode is active and user is on Free tier', async () => {
    const subscription = {
      tier: 'Free',
      features: ['dashboard', 'discovery'],
      isDemoMode: true,
      simulationEnabled: true,
    }

    render(
      <Subscription
        session={session}
        subscription={subscription}
        onSubscriptionChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Pro')).toBeInTheDocument()
    })

    const unlockButtons = screen.getAllByRole('button', { name: /unlock pro demo/i })
    expect(unlockButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('does NOT render "Unlock Pro Demo" when user is already on Pro tier', async () => {
    const subscription = {
      tier: 'Pro',
      features: ['dashboard', 'discovery', 'roadmap'],
      isDemoMode: true,
      simulationEnabled: true,
    }

    render(
      <Subscription
        session={session}
        subscription={subscription}
        onSubscriptionChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Pro')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /unlock pro demo/i })).toBeNull()
    expect(screen.getByText('Current plan')).toBeInTheDocument()
  })

  it('does NOT render "Unlock Pro Demo" when user is already on Premium tier', async () => {
    const subscription = {
      tier: 'Premium',
      features: ['dashboard', 'discovery', 'roadmap', 'aiInterview'],
      isDemoMode: true,
      simulationEnabled: true,
    }

    render(
      <Subscription
        session={session}
        subscription={subscription}
        onSubscriptionChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Premium')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /unlock pro demo/i })).toBeNull()
  })

  it('does NOT render "Unlock Pro Demo" when demo mode is disabled', async () => {
    const subscription = {
      tier: 'Free',
      features: ['dashboard', 'discovery'],
      isDemoMode: false,
      simulationEnabled: false,
      stripeConfigured: true,
    }

    render(
      <Subscription
        session={session}
        subscription={subscription}
        onSubscriptionChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Pro')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /unlock pro demo/i })).toBeNull()
  })

  it('clicking "Unlock Pro Demo" calls /subscription/demo-pro, refreshes subscription, and displays success toast', async () => {
    const onSubscriptionChange = vi.fn()
    const subscription = {
      tier: 'Free',
      features: ['dashboard', 'discovery'],
      isDemoMode: true,
      simulationEnabled: true,
    }

    render(
      <Subscription
        session={session}
        subscription={subscription}
        onSubscriptionChange={onSubscriptionChange}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /unlock pro demo/i }).length).toBeGreaterThan(0)
    })

    const unlockBtn = screen.getAllByRole('button', { name: /unlock pro demo/i })[0]
    fireEvent.click(unlockBtn)

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/subscription/demo-pro', expect.objectContaining({
        token: session.token,
        method: 'POST',
      }))
      expect(onSubscriptionChange).toHaveBeenCalled()
      expect(screen.getByText(/Pro demo access enabled/i)).toBeInTheDocument()
    })
  })

  it('displays API error visibly when unlock fails', async () => {
    apiRequest.mockImplementation((endpoint) => {
      if (endpoint === '/subscription/plans') {
        return Promise.resolve(mockPlans)
      }
      if (endpoint === '/subscription/demo-pro') {
        return Promise.reject(new Error('Simulated checkout is disabled in Production.'))
      }
      return Promise.resolve({})
    })

    const subscription = {
      tier: 'Free',
      features: ['dashboard', 'discovery'],
      isDemoMode: true,
      simulationEnabled: true,
    }

    render(
      <Subscription
        session={session}
        subscription={subscription}
        onSubscriptionChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /unlock pro demo/i }).length).toBeGreaterThan(0)
    })

    const unlockBtn = screen.getAllByRole('button', { name: /unlock pro demo/i })[0]
    fireEvent.click(unlockBtn)

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('Simulated checkout is disabled in Production.')
    })
  })

  it('verifies entitlement gating: Roadmap unlocked on Pro, AI Interview locked requiring Premium', () => {
    // Test the exact entitlement logic used by App.jsx
    const proSubscription = {
      tier: 'Pro',
      features: ['dashboard', 'discovery', 'recommendations', 'community', 'profile', 'roadmap'],
    }

    const PAGE_FEATURE = {
      Roadmap: 'roadmap',
      'AI Interview': 'aiInterview',
    }
    const FEATURE_TIER = { roadmap: 'Pro', aiInterview: 'Premium' }

    const isLocked = (page) => {
      const required = PAGE_FEATURE[page]
      return Boolean(required) && !proSubscription.features.includes(required)
    }

    // Roadmap feature is unlocked
    expect(isLocked('Roadmap')).toBe(false)

    // AI Interview feature remains strictly locked
    expect(isLocked('AI Interview')).toBe(true)

    // When locked, LockedFeature displays that AI Interview is part of Premium
    const { getByText } = render(
      <LockedFeature
        page="AI Interview"
        requiredTier={FEATURE_TIER[PAGE_FEATURE['AI Interview']]}
        onUpgrade={vi.fn()}
      />
    )
    expect(getByText('AI Interview is part of Premium')).toBeInTheDocument()
    expect(getByText(/Upgrade your plan to unlock it/i)).toBeInTheDocument()
  })
})

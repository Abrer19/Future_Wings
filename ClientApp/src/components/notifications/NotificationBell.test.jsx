import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NotificationBell from './NotificationBell.jsx'
import * as auth from '../../auth.js'
import * as signalRLib from '../../lib/notificationSignalR.js'

describe('NotificationBell & NotificationPanel', () => {
  const mockSession = {
    token: 'mock-jwt-token',
    id: 1,
    email: 'student@example.com',
    role: 'Student',
  }

  const sampleNotifications = [
    {
      id: 101,
      userId: 1,
      title: 'Overdue: Submit Statement of Purpose',
      message: 'The deadline for SOP was due yesterday and is now overdue.',
      type: 'deadline_overdue',
      targetPage: 'Dashboard',
      targetId: '5',
      eventKey: 'deadline-5-overdue',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 102,
      userId: 1,
      title: 'Due Soon: Recommendation Letters',
      message: 'Your letters are due within 24 hours.',
      type: 'deadline_1d',
      targetPage: 'Dashboard',
      targetId: '6',
      eventKey: 'deadline-6-1d',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 103,
      userId: 1,
      title: 'Scholarship Deadline: Global Excellence',
      message: 'Scholarship applications close this month.',
      type: 'scholarship_deadline',
      targetPage: 'Scholarships',
      targetId: '12',
      eventKey: 'scholarship-12',
      isRead: true,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]

  let signalRCallback = null

  beforeEach(() => {
    vi.restoreAllMocks()

    // Mock SignalR
    vi.spyOn(signalRLib, 'initNotificationSignalR').mockImplementation(
      (token, onNotificationReceived, onStatusChange) => {
        signalRCallback = onNotificationReceived
        onStatusChange?.('connected')
        return {
          connection: {},
          disconnect: vi.fn(),
        }
      }
    )

    // Mock API requests
    vi.spyOn(auth, 'apiRequest').mockImplementation((path, options) => {
      if (path === '/notifications' && (!options?.method || options.method === 'GET')) {
        return Promise.resolve({
          unreadCount: 2,
          notifications: sampleNotifications,
        })
      }
      if (path === '/notifications/unread-count') {
        return Promise.resolve({ unreadCount: 2 })
      }
      if (path?.startsWith('/notifications/') && options?.method === 'PUT') {
        return Promise.resolve({ id: 101, isRead: true })
      }
      if (path === '/notifications/read-all' && options?.method === 'PUT') {
        return Promise.resolve({ markedCount: 2 })
      }
      if (path?.startsWith('/notifications/') && options?.method === 'DELETE') {
        return Promise.resolve(null)
      }
      return Promise.resolve({})
    })
  })

  it('renders notification bell with correct unread badge when unread notifications exist', async () => {
    await act(async () => {
      render(<NotificationBell onNavigate={vi.fn()} session={mockSession} />)
    })

    const bellBtn = screen.getByTestId('notification-bell-btn')
    expect(bellBtn).toBeInTheDocument()
    expect(bellBtn).toHaveAttribute('aria-haspopup', 'dialog')
    expect(bellBtn).toHaveAttribute('aria-expanded', 'false')

    await waitFor(() => {
      const badge = screen.getByTestId('notification-unread-badge')
      expect(badge).toBeInTheDocument()
      expect(badge.textContent).toBe('2')
    })

    expect(bellBtn).toHaveAttribute('aria-label', expect.stringContaining('2 unread'))
  })

  it('hides badge when unreadCount is 0', async () => {
    vi.spyOn(auth, 'apiRequest').mockResolvedValueOnce({
      unreadCount: 0,
      notifications: [],
    })

    await act(async () => {
      render(<NotificationBell onNavigate={vi.fn()} session={mockSession} />)
    })

    await waitFor(() => {
      expect(screen.queryByTestId('notification-unread-badge')).toBeNull()
    })
    const bellBtn = screen.getByTestId('notification-bell-btn')
    expect(bellBtn).toHaveAttribute('aria-label', 'Notifications')
  })

  it('toggles notification panel open and closed', async () => {
    await act(async () => {
      render(<NotificationBell onNavigate={vi.fn()} session={mockSession} />)
    })

    const bellBtn = screen.getByTestId('notification-bell-btn')

    // Click to open
    await act(async () => {
      fireEvent.click(bellBtn)
    })
    expect(bellBtn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument()

    // Click close button
    const closeBtn = screen.getByTestId('panel-close-btn')
    await act(async () => {
      fireEvent.click(closeBtn)
    })
    expect(screen.queryByTestId('notification-panel')).toBeNull()
    expect(bellBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes panel when Escape key is pressed', async () => {
    await act(async () => {
      render(<NotificationBell onNavigate={vi.fn()} session={mockSession} />)
    })

    const bellBtn = screen.getByTestId('notification-bell-btn')
    await act(async () => {
      fireEvent.click(bellBtn)
    })
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument()

    // Press Escape
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' })
    })
    expect(screen.queryByTestId('notification-panel')).toBeNull()
  })

  it('displays notification details including overdue and deadline types', async () => {
    await act(async () => {
      render(<NotificationBell onNavigate={vi.fn()} session={mockSession} />)
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('notification-bell-btn'))
    })

    await waitFor(() => {
      expect(screen.getByText(/Overdue: Submit Statement of Purpose/i)).toBeInTheDocument()
      expect(screen.getByText(/Due Soon: Recommendation Letters/i)).toBeInTheDocument()
      expect(screen.getByText(/Scholarship Deadline: Global Excellence/i)).toBeInTheDocument()
    })

    // Badges
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText('Due Soon')).toBeInTheDocument()
    expect(screen.getByText('Scholarship')).toBeInTheDocument()
  })

  it('filters by tabs (All, Unread, Deadlines)', async () => {
    await act(async () => {
      render(<NotificationBell onNavigate={vi.fn()} session={mockSession} />)
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('notification-bell-btn'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('notification-item-101')).toBeInTheDocument()
    })

    // Click Unread tab
    await act(async () => {
      fireEvent.click(screen.getByTestId('tab-unread'))
    })
    expect(screen.getByTestId('notification-item-101')).toBeInTheDocument()
    expect(screen.getByTestId('notification-item-102')).toBeInTheDocument()
    expect(screen.queryByTestId('notification-item-103')).toBeNull()

    // Click Deadlines tab
    await act(async () => {
      fireEvent.click(screen.getByTestId('tab-deadlines'))
    })
    expect(screen.getByTestId('notification-item-101')).toBeInTheDocument()
    expect(screen.getByTestId('notification-item-102')).toBeInTheDocument()
    expect(screen.getByTestId('notification-item-103')).toBeInTheDocument()
  })

  it('marks individual notification as read', async () => {
    const apiSpy = vi.spyOn(auth, 'apiRequest')
    await act(async () => {
      render(<NotificationBell onNavigate={vi.fn()} session={mockSession} />)
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('notification-bell-btn'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('mark-read-btn-101')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('mark-read-btn-101'))
    })

    expect(apiSpy).toHaveBeenCalledWith('/notifications/101/read', expect.objectContaining({ method: 'PUT' }))
  })

  it('marks all notifications as read', async () => {
    const apiSpy = vi.spyOn(auth, 'apiRequest')
    await act(async () => {
      render(<NotificationBell onNavigate={vi.fn()} session={mockSession} />)
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('notification-bell-btn'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('panel-mark-all-read-btn')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('panel-mark-all-read-btn'))
    })

    expect(apiSpy).toHaveBeenCalledWith('/notifications/read-all', expect.objectContaining({ method: 'PUT' }))
    await waitFor(() => {
      expect(screen.queryByTestId('notification-unread-badge')).toBeNull()
    })
  })

  it('navigates to target page and marks notification read when action link is clicked', async () => {
    const navigateMock = vi.fn()
    const apiSpy = vi.spyOn(auth, 'apiRequest')

    await act(async () => {
      render(<NotificationBell onNavigate={navigateMock} session={mockSession} />)
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('notification-bell-btn'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('action-link-101')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('action-link-101'))
    })

    expect(apiSpy).toHaveBeenCalledWith('/notifications/101/read', expect.objectContaining({ method: 'PUT' }))
    expect(navigateMock).toHaveBeenCalledWith('Dashboard', '5')
    expect(screen.queryByTestId('notification-panel')).toBeNull()
  })

  it('deletes notification item on dismiss click', async () => {
    const apiSpy = vi.spyOn(auth, 'apiRequest')

    await act(async () => {
      render(<NotificationBell onNavigate={vi.fn()} session={mockSession} />)
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('notification-bell-btn'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('delete-btn-101')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-btn-101'))
    })

    expect(apiSpy).toHaveBeenCalledWith('/notifications/101', expect.objectContaining({ method: 'DELETE' }))
    await waitFor(() => {
      expect(screen.queryByTestId('notification-item-101')).toBeNull()
    })
  })

  it('receives real-time notification via SignalR callback and prepends to list', async () => {
    await act(async () => {
      render(<NotificationBell onNavigate={vi.fn()} session={mockSession} />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('notification-unread-badge').textContent).toBe('2')
    })

    expect(signalRCallback).toBeTypeOf('function')
    await act(async () => {
      signalRCallback({
        id: 999,
        userId: 1,
        title: 'Real-time Visa Reminder',
        message: 'Please verify your visa appointment.',
        type: 'general',
        targetPage: 'Visa Check',
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    })

    await waitFor(() => {
      expect(screen.getByTestId('notification-unread-badge').textContent).toBe('3')
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('notification-bell-btn'))
    })
    expect(screen.getByText('Real-time Visa Reminder')).toBeInTheDocument()
  })

  it('displays real-time connection status pill in footer', async () => {
    await act(async () => {
      render(<NotificationBell onNavigate={vi.fn()} session={mockSession} />)
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('notification-bell-btn'))
    })

    await waitFor(() => {
      const statusEl = screen.getByTestId('panel-connection-status')
      expect(statusEl.textContent).toContain('Real-time connected')
    })
  })
})

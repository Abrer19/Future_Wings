import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../../auth.js'
import { initNotificationSignalR } from '../../lib/notificationSignalR.js'
import NotificationPanel from './NotificationPanel.jsx'

export default function NotificationBell({ session, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  const containerRef = useRef(null)
  const token = session?.token

  const loadNotifications = useCallback(async () => {
    if (!token) return
    try {
      setIsLoading(true)
      const data = await apiRequest('/notifications', { token })
      if (data) {
        setNotifications(data.notifications || [])
        setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0)
      }
    } catch (err) {
      // Quietly log or ignore network failure on background poll
      console.warn('Failed to load notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  // Initial load
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Real-time SignalR connection with automatic fallback
  useEffect(() => {
    if (!token) return

    const handleNewNotification = (notification) => {
      if (!notification?.id) return
      setNotifications((prev) => {
        // Prevent duplicate if already in state
        if (prev.some((n) => n.id === notification.id || (n.eventKey && n.eventKey === notification.eventKey))) {
          return prev
        }
        return [notification, ...prev]
      })
      if (!notification.isRead) {
        setUnreadCount((count) => count + 1)
      }
    }

    const { disconnect } = initNotificationSignalR(
      token,
      handleNewNotification,
      (status) => setConnectionStatus(status)
    )

    // Polling fallback / interval sync every 45 seconds
    const intervalId = setInterval(() => {
      loadNotifications()
    }, 45000)

    // Re-sync on window focus
    const handleWindowFocus = () => {
      loadNotifications()
    }
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      disconnect()
      clearInterval(intervalId)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [token, loadNotifications])

  const handleMarkAsRead = async (id) => {
    if (!session?.token) return
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount((count) => Math.max(0, count - 1))

      await apiRequest(`/notifications/${id}/read`, {
        method: 'PUT',
        token: session.token,
      })
    } catch (err) {
      console.warn('Failed to mark notification as read:', err)
      loadNotifications() // Revert to server state on error
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!session?.token || unreadCount === 0) return
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      )
      setUnreadCount(0)

      await apiRequest('/notifications/read-all', {
        method: 'PUT',
        token: session.token,
      })
    } catch (err) {
      console.warn('Failed to mark all notifications as read:', err)
      loadNotifications()
    }
  }

  const handleDelete = async (id) => {
    if (!session?.token) return
    try {
      const target = notifications.find((n) => n.id === id)
      // Optimistic removal
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (target && !target.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1))
      }

      await apiRequest(`/notifications/${id}`, {
        method: 'DELETE',
        token: session.token,
      })
    } catch (err) {
      console.warn('Failed to delete notification:', err)
      loadNotifications()
    }
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        aria-controls="notification-panel"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-secondary-500 transition hover:bg-secondary-100 hover:text-secondary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        data-testid="notification-bell-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
          viewBox="0 0 24 24"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge pill */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-extrabold text-white shadow-sm ring-2 ring-white"
            data-testid="notification-unread-badge"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel
        connectionStatus={connectionStatus}
        isLoading={isLoading}
        isOpen={isOpen}
        notifications={notifications}
        onClose={() => setIsOpen(false)}
        onDelete={handleDelete}
        onMarkAllAsRead={handleMarkAllAsRead}
        onMarkAsRead={handleMarkAsRead}
        onNavigate={onNavigate}
        unreadCount={unreadCount}
      />
    </div>
  )
}

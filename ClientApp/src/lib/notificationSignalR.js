import * as signalR from '@microsoft/signalr'

/**
 * Derives the SignalR notification hub URL from environment configuration.
 */
export function getNotificationHubUrl() {
  const baseApi = import.meta.env.VITE_API_URL ?? '/api'
  const root = baseApi.replace(/\/api\/?$/, '')
  return `${root}/hubs/notifications`
}

/**
 * Creates and initializes a SignalR HubConnection for real-time notifications.
 *
 * @param {string} token - The user JWT authentication token.
 * @param {Function} onNotificationReceived - Callback receiving new notification DTO.
 * @param {Function} [onStatusChange] - Callback receiving connection status string:
 *        'connecting' | 'connected' | 'reconnecting' | 'disconnected'.
 * @returns {object} Object with `connection` and `disconnect` function.
 */
export function initNotificationSignalR(token, onNotificationReceived, onStatusChange = () => {}) {
  if (!token || typeof window === 'undefined') {
    return { connection: null, disconnect: () => {} }
  }

  const hubUrl = getNotificationHubUrl()

  let connection = null
  let isManuallyClosed = false

  try {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.ServerSentEvents |
          signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.None)
      .build()
  } catch (err) {
    onStatusChange('disconnected', err)
    return { connection: null, disconnect: () => {} }
  }

  connection.on('ReceiveNotification', (notification) => {
    if (notification && typeof onNotificationReceived === 'function') {
      onNotificationReceived(notification)
    }
  })

  connection.onreconnecting((err) => {
    onStatusChange('reconnecting', err)
  })

  connection.onreconnected(() => {
    onStatusChange('connected')
  })

  connection.onclose((err) => {
    if (!isManuallyClosed) {
      onStatusChange('disconnected', err)
    }
  })

  onStatusChange('connecting')

  connection
    .start()
    .then(() => {
      onStatusChange('connected')
    })
    .catch((err) => {
      onStatusChange('disconnected', err)
    })

  const disconnect = async () => {
    isManuallyClosed = true
    if (connection) {
      try {
        await connection.stop()
      } catch {
        // Ignore stop errors on unmount/cleanup
      }
    }
  }

  return { connection, disconnect }
}

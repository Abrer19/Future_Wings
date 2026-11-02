const RETURN_TO_KEY = 'futurewings.return_to'

export function getReturnTo() {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage?.getItem(RETURN_TO_KEY) || null
  } catch {
    return null
  }
}

export function setReturnTo(destination) {
  if (typeof window === 'undefined') return
  try {
    if (destination) {
      window.sessionStorage?.setItem(RETURN_TO_KEY, destination)
    } else {
      window.sessionStorage?.removeItem(RETURN_TO_KEY)
    }
  } catch {
    // Ignore storage issues in test/restricted environments
  }
}

export function clearReturnTo() {
  setReturnTo(null)
}

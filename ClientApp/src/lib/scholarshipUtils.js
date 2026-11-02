export const flag = (name) =>
  ({
    Canada: '🇨🇦',
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    Germany: '🇩🇪',
    Australia: '🇦🇺',
    France: '🇫🇷',
    Japan: '🇯🇵',
    Singapore: '🇸🇬',
    Sweden: '🇸🇪',
    Switzerland: '🇨🇭',
    Netherlands: '🇳🇱',
    Ireland: '🇮🇪',
    Finland: '🇫🇮',
    'New Zealand': '🇳🇿',
  }[name] ?? '🌍')

export const money = (amount) =>
  amount == null
    ? 'Amount varies'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)

export const date = (value) =>
  value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value)) : 'Rolling deadline'

export const isDeadlinePassed = (value) => {
  if (!value) return false
  const target = new Date(value)
  return !Number.isNaN(target.getTime()) && target.getTime() < Date.now()
}

export const isDeadlineApproaching = (value, thresholdDays = 30) => {
  if (!value) return false
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return false
  const diffMs = target.getTime() - Date.now()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= thresholdDays
}

export const getDeadlineStatus = (value) => {
  if (!value) {
    return {
      status: 'rolling',
      label: 'Rolling deadline',
      badgeClass: 'bg-secondary-100 text-secondary-700 border border-secondary-200/80',
    }
  }

  const target = new Date(value)
  if (Number.isNaN(target.getTime())) {
    return {
      status: 'unknown',
      label: 'Date not specified',
      badgeClass: 'bg-secondary-100 text-secondary-700 border border-secondary-200/80',
    }
  }

  const diffMs = target.getTime() - Date.now()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return {
      status: 'expired',
      isExpired: true,
      label: 'Deadline passed',
      formattedDate: date(value),
      badgeClass: 'bg-danger-50 text-danger-700 border border-danger-200 font-bold',
    }
  }

  if (diffDays <= 30) {
    const daysLabel = diffDays === 0 ? 'Due today' : diffDays === 1 ? 'Due tomorrow' : `Due in ${diffDays} days`
    return {
      status: 'approaching',
      isApproaching: true,
      daysRemaining: diffDays,
      label: daysLabel,
      formattedDate: date(value),
      badgeClass: 'bg-warning-50 text-warning-700 border border-warning-200 font-bold',
    }
  }

  return {
    status: 'upcoming',
    isUpcoming: true,
    daysRemaining: diffDays,
    label: date(value),
    formattedDate: date(value),
    badgeClass: 'bg-secondary-100 text-secondary-700 border border-secondary-200/80',
  }
}

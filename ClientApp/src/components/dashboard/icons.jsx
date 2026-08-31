// Inline SVG icons for the Dashboard. No icon package is installed, so these are
// hand-rolled rather than adding a dependency.
//
// Kept separate from components/home/icons.jsx so the two folders stay independent;
// if a third surface needs icons, promote both into a shared components/icons/.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': 'true',
  focusable: 'false',
}

function Icon({ children, className = 'h-4 w-4', ...rest }) {
  return (
    <svg className={className} {...base} {...rest}>
      {children}
    </svg>
  )
}

export function CheckIcon({ className = 'h-3 w-3' }) {
  return (
    <Icon className={className} strokeWidth={3}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Icon>
  )
}

export function AlertIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M10.6 3.9 2.3 18a1.6 1.6 0 0 0 1.4 2.4h16.6a1.6 1.6 0 0 0 1.4-2.4L13.4 3.9a1.6 1.6 0 0 0-2.8 0Z" />
      <path d="M12 9.5v4M12 17.2h.01" />
    </Icon>
  )
}

export function ClockIcon({ className }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.4V12l3 1.8" />
    </Icon>
  )
}

export function CheckCircleIcon({ className }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.6 12.2 2.3 2.3 4.5-4.6" />
    </Icon>
  )
}

export function TrashIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M4.8 6.6h14.4M9.4 6.6V5.2a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4v1.4" />
      <path d="M17.6 6.6 17 19a1.4 1.4 0 0 1-1.4 1.3H8.4A1.4 1.4 0 0 1 7 19L6.4 6.6" />
    </Icon>
  )
}

export function PlusIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Icon>
  )
}

export function InboxIcon({ className = 'h-6 w-6' }) {
  return (
    <Icon className={className}>
      <path d="M3.5 13.5h4l1.4 2.4h6.2l1.4-2.4h4" />
      <path d="M5.6 5.4h12.8l3.1 8.1V18a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2v-4.5z" />
    </Icon>
  )
}

export function CloseIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  )
}

/** Spinner for a row's own in-flight mutation. */
export function SpinnerIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

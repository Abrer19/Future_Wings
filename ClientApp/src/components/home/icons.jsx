// Inline SVG icon set for the public homepage.
// No icon package is installed (package.json deps are react + react-dom only),
// so these are hand-rolled rather than adding a dependency.
// Every icon is decorative by default (aria-hidden) — the accessible name comes
// from the surrounding button/heading, never from the glyph.

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

function Icon({ children, className = 'h-5 w-5', ...rest }) {
  return (
    <svg className={className} {...base} {...rest}>
      {children}
    </svg>
  )
}

export function LogoMark({ className = 'h-6 w-6' }) {
  return (
    <Icon className={className}>
      <path d="M2.5 12.5 21 4l-5.5 16.5-3.2-6.6z" />
      <path d="m12.3 13.9 8.7-9.9" />
    </Icon>
  )
}

export function SparkleIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.8L12 18l-1.7-5.5L4.8 10.7 10.3 9z" />
      <path d="M18.5 3v3M20 4.5h-3" />
    </Icon>
  )
}

export function ArrowRightIcon({ className = 'h-4 w-4' }) {
  return (
    <Icon className={className}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  )
}

export function ChevronDownIcon({ className = 'h-5 w-5' }) {
  return (
    <Icon className={className}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  )
}

export function ChevronLeftIcon({ className = 'h-5 w-5' }) {
  return (
    <Icon className={className}>
      <path d="m14 6-6 6 6 6" />
    </Icon>
  )
}

export function ChevronRightIcon({ className = 'h-5 w-5' }) {
  return (
    <Icon className={className}>
      <path d="m10 6 6 6-6 6" />
    </Icon>
  )
}

export function MenuIcon({ className = 'h-5 w-5' }) {
  return (
    <Icon className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  )
}

export function CloseIcon({ className = 'h-5 w-5' }) {
  return (
    <Icon className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  )
}

/* ---------- feature + process icons ---------- */

export function CompassIcon({ className }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.2 8.8-1.9 4.5-4.5 1.9 1.9-4.5z" />
    </Icon>
  )
}

export function ScholarshipIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M12 4 2.8 8.6 12 13.2l9.2-4.6z" />
      <path d="M6.4 10.7v4.1c0 1.6 2.5 2.9 5.6 2.9s5.6-1.3 5.6-2.9v-4.1" />
      <path d="M21.2 8.6v5" />
    </Icon>
  )
}

export function TrackIcon({ className }) {
  return (
    <Icon className={className}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
      <path d="M8.8 3.5h6.4v2.6H8.8z" />
      <path d="m8.8 12 2.1 2.1 4.3-4.3" />
    </Icon>
  )
}

export function DocumentCheckIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M13.5 3.5H7.2A2.2 2.2 0 0 0 5 5.7v12.6a2.2 2.2 0 0 0 2.2 2.2h9.6a2.2 2.2 0 0 0 2.2-2.2V9z" />
      <path d="M13.5 3.5V9H19" />
      <path d="m9.2 14.4 1.9 1.9 3.7-3.7" />
    </Icon>
  )
}

export function ShieldIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M12 3.2 5 6v5.4c0 4.2 2.9 8 7 9.4 4.1-1.4 7-5.2 7-9.4V6z" />
      <path d="m9.3 12 1.9 1.9 3.6-3.7" />
    </Icon>
  )
}

export function StarIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9z" />
    </Icon>
  )
}

export function StarFilledIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9z" />
    </svg>
  )
}

export function UserPlusIcon({ className }) {
  return (
    <Icon className={className}>
      <circle cx="10" cy="8" r="3.6" />
      <path d="M3.6 20c0-3.2 2.9-5.7 6.4-5.7 1.3 0 2.5.3 3.5.9" />
      <path d="M18 14v5M20.5 16.5h-5" />
    </Icon>
  )
}

export function ProfileIcon({ className }) {
  return (
    <Icon className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <circle cx="9" cy="11" r="2.2" />
      <path d="M5.8 16.4c.5-1.4 1.8-2.2 3.2-2.2s2.7.8 3.2 2.2" />
      <path d="M15.2 10h3.6M15.2 13.4h3.6" />
    </Icon>
  )
}

export function UploadIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M4.5 15.5v2.8a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2.8" />
      <path d="M12 15.2V3.8" />
      <path d="m7.8 8 4.2-4.2L16.2 8" />
    </Icon>
  )
}

export function SendIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M3.5 12.2 20.5 4l-8.2 17-1.9-7z" />
      <path d="m10.4 14 3.4-3.4" />
    </Icon>
  )
}

export function BadgeCheckIcon({ className }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.6 12.2 2.3 2.3 4.5-4.6" />
    </Icon>
  )
}

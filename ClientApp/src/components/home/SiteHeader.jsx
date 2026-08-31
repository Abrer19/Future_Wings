import { useEffect, useRef, useState } from 'react'
import { CloseIcon, LogoMark, MenuIcon } from './icons.jsx'

const links = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#features' },
  { label: 'News', href: '#destinations' },
  { label: 'Contact', href: '#contact' },
]

export default function SiteHeader({ onSignIn, onSignUp }) {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef(null)
  const panelRef = useRef(null)

  // Escape closes the mobile panel and returns focus to the control that opened it,
  // so keyboard users are never stranded inside an expanded disclosure.
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  // Move focus into the panel when it opens.
  useEffect(() => {
    if (open) panelRef.current?.querySelector('a')?.focus()
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          className="flex shrink-0 items-center gap-2 rounded-lg text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          href="#home"
        >
          <LogoMark className="h-5 w-5" />
          <span className="text-base font-extrabold tracking-tight text-secondary-950">FutureWings</span>
        </a>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((link, index) => (
              <li key={link.label}>
                <a
                  aria-current={index === 0 ? 'page' : undefined}
                  className={
                    index === 0
                      ? 'rounded-full bg-primary-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
                      : 'rounded-full px-4 py-1.5 text-sm font-medium text-secondary-500 transition hover:bg-secondary-500/10 hover:text-secondary-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
                  }
                  href={link.href}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="hidden rounded-full px-4 py-1.5 text-sm font-semibold text-secondary-500 transition hover:text-secondary-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:block"
            onClick={onSignIn}
            type="button"
          >
            Log In
          </button>
          <button
            className="rounded-full bg-primary-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            onClick={onSignUp}
            type="button"
          >
            Sign Up
          </button>
          <button
            aria-controls="mobile-nav"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="rounded-lg p-2 text-secondary-500 transition hover:bg-secondary-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 md:hidden"
            onClick={() => setOpen((value) => !value)}
            ref={toggleRef}
            type="button"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <nav
        aria-label="Primary mobile"
        className="border-t border-black/5 bg-white px-4 pb-4 pt-2 md:hidden"
        hidden={!open}
        id="mobile-nav"
        ref={panelRef}
      >
        <ul className="grid gap-1">
          {links.map((link) => (
            <li key={link.label}>
              <a
                className="block rounded-lg px-3 py-2 text-sm font-medium text-secondary-500 transition hover:bg-secondary-500/10 hover:text-secondary-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                href={link.href}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <button
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-secondary-500 transition hover:bg-secondary-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:hidden"
              onClick={() => {
                setOpen(false)
                onSignIn?.()
              }}
              type="button"
            >
              Log In
            </button>
          </li>
        </ul>
      </nav>
    </header>
  )
}

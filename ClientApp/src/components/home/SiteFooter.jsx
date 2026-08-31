import { LogoMark } from './icons.jsx'

const columns = [
  {
    heading: 'Quick Links',
    links: [
      { label: 'Home', href: '#home' },
      { label: 'About', href: '#features' },
      { label: 'Contact', href: '#contact' },
      { label: 'Blog', href: '#testimonials' },
    ],
  },
  {
    heading: 'Platform',
    links: [
      { label: 'Recommendations', href: '#features' },
      { label: 'Applications', href: '#process' },
      { label: 'Documents', href: '#process' },
      { label: 'Profile', href: '#home' },
    ],
  },
]

const social = [
  { label: 'Twitter', href: 'https://twitter.com' },
  { label: 'LinkedIn', href: 'https://linkedin.com' },
  { label: 'GitHub', href: 'https://github.com' },
]

export default function SiteFooter() {
  return (
    <footer className="border-t border-secondary-500/10 bg-white" id="contact">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="flex items-center gap-2 text-primary-500">
              <LogoMark className="h-5 w-5" />
              <span className="text-base font-extrabold tracking-tight text-primary-500">
                FutureWings
              </span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-6 text-secondary-500">
              Your smart path to studying abroad. Discover, apply, and track — all in one place.
            </p>
          </div>

          {columns.map(({ heading, links }) => (
            <nav aria-labelledby={`footer-${heading.replace(/\s+/g, '-').toLowerCase()}`} key={heading}>
              <h2
                className="text-sm font-bold text-secondary-950"
                id={`footer-${heading.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={`${heading}-${link.label}`}>
                    <a
                      className="rounded text-sm text-secondary-500 transition hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                      href={link.href}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="text-sm font-bold text-secondary-950">Contact</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-secondary-500">
              <li>
                <a
                  className="rounded transition hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  href="mailto:futurewingshelp@gmail.com"
                >
                  futurewingshelp@gmail.com
                </a>
              </li>
              <li>
                <a
                  className="rounded transition hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  href="tel:+8801973685515"
                >
                  01973685515
                </a>
              </li>
            </ul>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {social.map((item) => (
                <li key={item.label}>
                  <a
                    className="rounded text-sm text-secondary-500 transition hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                    href={item.href}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-12 border-t border-secondary-500/10 pt-6 text-xs text-secondary-500">
          © {new Date().getFullYear()} FutureWings. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

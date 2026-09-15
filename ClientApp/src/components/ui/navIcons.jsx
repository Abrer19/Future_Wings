/**
 * One icon per navigation destination.
 *
 * A text-only nav is the single strongest "internal tool" signal; every shipped SaaS
 * product pairs a glyph with the label so items are scannable by shape, not just by
 * reading. Stroke weight and 24px box are shared so they sit on one optical grid.
 */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': 'true',
  focusable: 'false',
}

function Icon({ children }) {
  return <svg className="h-[18px] w-[18px] shrink-0" {...base}>{children}</svg>
}

const icons = {
  Dashboard: () => (
    <Icon><rect height="7" rx="1.5" width="7" x="3.5" y="3.5" /><rect height="7" rx="1.5" width="7" x="13.5" y="3.5" /><rect height="7" rx="1.5" width="7" x="3.5" y="13.5" /><rect height="7" rx="1.5" width="7" x="13.5" y="13.5" /></Icon>
  ),
  Roadmap: () => (
    <Icon><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="12" r="2.5" /><circle cx="6" cy="18" r="2.5" /><path d="M8.5 6h4a3 3 0 0 1 3 3v.5M15.5 14.5v.5a3 3 0 0 1-3 3h-4" /></Icon>
  ),
  Discovery: () => (
    <Icon><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></Icon>
  ),
  Recommendations: () => (
    <Icon><path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9z" /></Icon>
  ),
  Scholarships: () => (
    <Icon><path d="M12 4 2.8 8.6 12 13.2l9.2-4.6z" /><path d="M6.4 10.7v4.1c0 1.6 2.5 2.9 5.6 2.9s5.6-1.3 5.6-2.9v-4.1" /></Icon>
  ),
  Community: () => (
    <Icon><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19.5c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6M17.5 14.6c1.9.6 3.2 2.4 3.2 4.9" /></Icon>
  ),
  Applications: () => (
    <Icon><rect height="16.5" rx="2" width="14" x="5" y="3.7" /><path d="M9 3.7h6v2.6H9z" /><path d="M8.8 12h6.4M8.8 15.6h4.4" /></Icon>
  ),
  'Visa Check': () => (
    <Icon><path d="M12 3.2 5 6v5.4c0 4.2 2.9 8 7 9.4 4.1-1.4 7-5.2 7-9.4V6z" /><path d="m9.3 12 1.9 1.9 3.6-3.7" /></Icon>
  ),
  'AI Interview': () => (
    <Icon><rect height="10" rx="3" width="7" x="8.5" y="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" /></Icon>
  ),
  Profile: () => (
    <Icon><circle cx="12" cy="8" r="3.6" /><path d="M4.8 20c0-3.4 3.2-6 7.2-6s7.2 2.6 7.2 6" /></Icon>
  ),
  Plans: () => (
    <Icon><path d="M3.5 8.5h17M3.5 8.5 6 4.5h12l2.5 4M3.5 8.5v11a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5v-11" /><path d="M9.5 12a2.5 2.5 0 0 0 5 0" /></Icon>
  ),
  'Agent Panel': () => (
    <Icon><rect height="13" rx="2" width="18" x="3" y="6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18M12 11v4" /></Icon>
  ),
  Admin: () => (
    <Icon><path d="M12 3.4 4.5 6.6v5c0 4.4 3.1 8.4 7.5 9.4 4.4-1 7.5-5 7.5-9.4v-5z" /><path d="M12 9.5v3M12 15.4h.01" /></Icon>
  ),
  'User Management': () => (
    <Icon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>
  ),
  'Applications Oversight': () => (
    <Icon><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect height="4" rx="1" width="8" x="8" y="3" /><path d="m9 14 2 2 4-4" /></Icon>
  ),
  'Country Agents': () => (
    <Icon><circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" /></Icon>
  ),
  'Academic Catalog': () => (
    <Icon><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><line x1="9" x2="16" y1="7" y2="7" /><line x1="9" x2="14" y1="11" y2="11" /></Icon>
  ),
  'Scholarships Manager': () => (
    <Icon><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></Icon>
  ),
  'Admissions CRM': () => (
    <Icon><rect height="13" rx="2" width="18" x="3" y="6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18M12 11v4" /></Icon>
  ),
  'Programs Directory': () => (
    <Icon><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></Icon>
  ),
  'Scholarships Directory': () => (
    <Icon><path d="M12 4 2.8 8.6 12 13.2l9.2-4.6z" /><path d="M6.4 10.7v4.1c0 1.6 2.5 2.9 5.6 2.9s5.6-1.3 5.6-2.9v-4.1" /></Icon>
  ),
}

export default function NavIcon({ page }) {
  const Glyph = icons[page]
  return Glyph ? <Glyph /> : null
}

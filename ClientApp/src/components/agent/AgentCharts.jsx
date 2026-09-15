import { useState } from 'react'

export function PipelineFunnel({ stages = [], totalApplicants = 0 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const STAGE_COLORS = [
    { bg: 'from-slate-500 to-slate-600', stroke: '#64748b', text: 'text-slate-700', label: 'Drafts Created' },
    { bg: 'from-blue-500 to-blue-600', stroke: '#3b82f6', text: 'text-blue-700', label: 'Formal Submissions' },
    { bg: 'from-amber-500 to-amber-600', stroke: '#f59e0b', text: 'text-amber-700', label: 'Under Review' },
    { bg: 'from-emerald-500 to-emerald-600', stroke: '#10b981', text: 'text-emerald-700', label: 'Accepted Offers' },
    { bg: 'from-rose-500 to-rose-600', stroke: '#f43f5e', text: 'text-rose-700', label: 'Declined / Withdrawn' },
  ]

  const maxCount = Math.max(...stages.map((s) => s.count || 0), 1)

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-secondary-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-900">
              Admissions Conversion Funnel
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-secondary-500">
            Step-by-step candidate progression through territory evaluation gates
          </p>
        </div>
        <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-700">
          {totalApplicants} Total In-Flight
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {stages.map((st, i) => {
          const color = STAGE_COLORS[i % STAGE_COLORS.length]
          const pctWidth = Math.max((st.count / maxCount) * 100, 8)
          const isHovered = hoveredIndex === i

          return (
            <div
              key={st.stage}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`relative rounded-xl p-3 transition-all duration-200 ${
                isHovered ? 'bg-secondary-50 shadow-inner' : 'hover:bg-secondary-50/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-secondary-800 flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: color.stroke }}
                  />
                  {st.stage}
                  <span className="text-[11px] font-normal text-secondary-400">({color.label})</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-secondary-950">{st.count} students</span>
                  <span className="rounded-md bg-secondary-100 px-2 py-0.5 text-[11px] font-bold text-secondary-700">
                    {st.percentage}%
                  </span>
                </div>
              </div>

              {/* Funnel Progress Track */}
              <div className="h-3 w-full overflow-hidden rounded-full bg-secondary-100 p-0.5 shadow-inner">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${color.bg} transition-all duration-500`}
                  style={{ width: `${pctWidth}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TopInstitutionsChart({ universities = [] }) {
  const [hoveredUni, setHoveredUni] = useState(null)
  const max = Math.max(...universities.map((u) => u.applicantCount || 0), 1)

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-secondary-100 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-900">
            Top Destination Institutions
          </h3>
          <p className="mt-0.5 text-xs text-secondary-500">
            Student application volume across partnered territory campuses
          </p>
        </div>
        <span className="rounded-md bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 text-xs font-bold">
          {universities.length} Active Hubs
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {universities.length === 0 ? (
          <p className="py-8 text-center text-xs text-secondary-400">
            No institutional destination data available for this territory.
          </p>
        ) : (
          universities.map((uni, idx) => {
            const pct = Math.max(Math.round((uni.applicantCount / max) * 100), 12)
            const isHovered = hoveredUni === uni.universityName

            return (
              <div
                key={uni.universityName}
                onMouseEnter={() => setHoveredUni(uni.universityName)}
                onMouseLeave={() => setHoveredUni(null)}
                className={`rounded-xl p-3 transition ${
                  isHovered ? 'bg-secondary-50 shadow-sm' : 'hover:bg-secondary-50/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 truncate">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-200 text-[10px] font-bold text-secondary-800">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-secondary-900 truncate">
                      {uni.universityName}
                    </span>
                  </div>
                  <span className="font-extrabold text-teal-700 ml-2">
                    {uni.applicantCount} {uni.applicantCount === 1 ? 'applicant' : 'applicants'}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-secondary-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export function DegreeDistributionDonut({ degrees = [] }) {
  const [hoveredSlice, setHoveredSlice] = useState(null)

  const DEGREE_PALETTE = ['#0d9488', '#0284c7', '#8b5cf6', '#f59e0b', '#ec4899']
  const total = degrees.reduce((sum, d) => sum + (d.count || 0), 0)

  // Calculate SVG arc paths for donut
  let cumulativeAngle = 0
  const radius = 60
  const strokeWidth = 24
  const center = 80
  const circumference = 2 * Math.PI * radius

  const slices = degrees.map((d, i) => {
    const fraction = total > 0 ? d.count / total : 0
    const strokeDasharray = `${fraction * circumference} ${circumference}`
    const strokeDashoffset = -cumulativeAngle * circumference
    cumulativeAngle += fraction

    return {
      ...d,
      color: DEGREE_PALETTE[i % DEGREE_PALETTE.length],
      strokeDasharray,
      strokeDashoffset,
      fraction,
    }
  })

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
      <div className="border-b border-secondary-100 pb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-900">
          Degree Level Distribution
        </h3>
        <p className="mt-0.5 text-xs text-secondary-500">
          Undergraduate vs Postgraduate specialization profile
        </p>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-around gap-6">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center">
          <svg width="160" height="160" viewBox="0 0 160 160" className="rotate-[-90deg]">
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />
            {slices.map((slice) => (
              <circle
                key={slice.level}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={hoveredSlice === slice.level ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredSlice(slice.level)}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-black text-secondary-900">{total}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-400">
              Students
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full sm:w-auto space-y-2.5">
          {slices.length === 0 ? (
            <p className="text-xs text-secondary-400">No program distribution data.</p>
          ) : (
            slices.map((sl) => (
              <div
                key={sl.level}
                onMouseEnter={() => setHoveredSlice(sl.level)}
                onMouseLeave={() => setHoveredSlice(null)}
                className={`flex items-center justify-between gap-4 rounded-lg px-2.5 py-1.5 transition ${
                  hoveredSlice === sl.level ? 'bg-secondary-100 font-bold' : 'hover:bg-secondary-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: sl.color }}
                  />
                  <span className="text-xs text-secondary-800">{sl.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-secondary-900">{sl.count}</span>
                  <span className="text-[11px] text-secondary-400">
                    ({Math.round(sl.fraction * 100)}%)
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function CommissionMilestoneBar({ commissionTk = 0, commissionUsd = 0 }) {
  // Milestone targets in Tk
  const TIERS = [
    { name: 'Bronze Agent', thresholdTk: 200000, label: '৳200,000' },
    { name: 'Silver Agent', thresholdTk: 500000, label: '৳500,000' },
    { name: 'Gold Agent', thresholdTk: 1000000, label: '৳1,000,000' },
    { name: 'Platinum Agent', thresholdTk: 2500000, label: '৳2,500,000' },
  ]

  const currentTier = TIERS.slice().reverse().find((t) => commissionTk >= t.thresholdTk) || TIERS[0]
  const nextTier = TIERS.find((t) => commissionTk < t.thresholdTk) || TIERS[TIERS.length - 1]
  const progressPct = Math.min(Math.round((commissionTk / nextTier.thresholdTk) * 100), 100)

  return (
    <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-500/10 via-white to-emerald-500/10 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-teal-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
              Agent Earnings Ledger
            </span>
            <span className="text-xs font-bold text-teal-800">15% Placement Incentive</span>
          </div>
          <h3 className="mt-1 text-base font-bold text-secondary-950">
            Projected Agency Commission Pipeline
          </h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-teal-700">
            ৳{Number(commissionTk).toLocaleString()}
          </p>
          <p className="text-xs text-secondary-500">
            ≈ ${Number(commissionUsd).toLocaleString()} USD (120 Tk/$)
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-secondary-700">
            Current Tier: <strong className="text-teal-700">{currentTier.name}</strong>
          </span>
          <span className="font-semibold text-secondary-700">
            Target to {nextTier.name}: <strong className="text-teal-700">{nextTier.label}</strong> ({progressPct}%)
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-secondary-200 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
        {TIERS.map((tier) => {
          const reached = commissionTk >= tier.thresholdTk
          return (
            <div
              key={tier.name}
              className={`rounded-xl p-2.5 text-center text-xs border transition ${
                reached
                  ? 'border-teal-300 bg-teal-50/80 text-teal-900 font-bold'
                  : 'border-secondary-200 bg-white/70 text-secondary-500'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span>{reached ? '✓' : '○'}</span>
                <span>{tier.name}</span>
              </div>
              <p className="text-[10px] text-secondary-400 mt-0.5">{tier.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

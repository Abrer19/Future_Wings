import { useState } from 'react'

/**
 * Interactive Area & Line Chart for Revenue & MRR Trends
 */
export function RevenueAreaChart({ data = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-secondary-400">
        No historical revenue data available.
      </div>
    )
  }

  const maxVal = Math.max(...data.map((d) => d.grossRevenueUsd || d.mrrUsd || 100), 100) * 1.15
  const chartHeight = 220
  const chartWidth = 560
  const paddingX = 45
  const paddingY = 25
  const innerWidth = chartWidth - paddingX * 2
  const innerHeight = chartHeight - paddingY * 2

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * innerWidth
    const yGross = chartHeight - paddingY - (d.grossRevenueUsd / maxVal) * innerHeight
    const yMrr = chartHeight - paddingY - (d.mrrUsd / maxVal) * innerHeight
    return { x, yGross, yMrr, ...d }
  })

  // Create smooth SVG cubic bezier path
  const createSmoothPath = (pts, key) => {
    if (pts.length === 0) return ''
    let path = `M ${pts[0].x} ${pts[0][key]}`
    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i]
      const next = pts[i + 1]
      const controlX = (current.x + next.x) / 2
      path += ` C ${controlX} ${current[key]}, ${controlX} ${next[key]}, ${next.x} ${next[key]}`
    }
    return path
  }

  const grossPath = createSmoothPath(points, 'yGross')
  const mrrPath = createSmoothPath(points, 'yMrr')
  const areaPath = `${grossPath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`

  const yTicks = [0, maxVal * 0.33, maxVal * 0.66, maxVal]

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary-100 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-900">
            Revenue & MRR Growth Curve
          </h3>
          <p className="mt-0.5 text-xs text-secondary-500">6-Month rolling growth trajectory</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary-600" />
            <span className="text-secondary-700">Gross Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-secondary-700">Monthly Recurring (MRR)</span>
          </div>
        </div>
      </div>

      <div className="mt-4 relative">
        <svg className="w-full h-auto overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          <defs>
            <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="mrrLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const y = chartHeight - paddingY - (tick / maxVal) * innerHeight
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-secondary-400 font-mono text-[10px]"
                >
                  ${Math.round(tick).toLocaleString()}
                </text>
              </g>
            )
          })}

          {/* Area under Gross Revenue */}
          <path d={areaPath} fill="url(#revenueAreaGrad)" />

          {/* Lines */}
          <path d={grossPath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
          <path d={mrrPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 2" />

          {/* Data Points */}
          {points.map((pt, i) => (
            <g key={i} className="cursor-pointer" onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
              {/* Vertical indicator line on hover */}
              {hoverIndex === i && (
                <line
                  x1={pt.x}
                  y1={paddingY}
                  x2={pt.x}
                  y2={chartHeight - paddingY}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              )}
              {/* Gross point */}
              <circle
                cx={pt.x}
                cy={pt.yGross}
                r={hoverIndex === i ? 6 : 4}
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-all duration-150"
              />
              {/* MRR point */}
              <circle
                cx={pt.x}
                cy={pt.yMrr}
                r={hoverIndex === i ? 6 : 3.5}
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-all duration-150"
              />
              {/* X Axis label */}
              <text
                x={pt.x}
                y={chartHeight - 6}
                textAnchor="middle"
                className={`font-medium text-[11px] ${hoverIndex === i ? 'fill-primary-600 font-bold' : 'fill-secondary-500'}`}
              >
                {pt.month.split(' ')[0]}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverIndex !== null && points[hoverIndex] && (
          <div
            className="pointer-events-none absolute z-20 -top-2 rounded-xl border border-secondary-200 bg-secondary-950/90 px-3.5 py-2 text-white shadow-xl backdrop-blur-md"
            style={{
              left: `${(points[hoverIndex].x / chartWidth) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="text-[11px] font-bold text-secondary-300">{points[hoverIndex].month}</p>
            <p className="mt-1 text-xs font-semibold text-blue-300">
              Gross: <span className="font-mono text-white">${points[hoverIndex].grossRevenueUsd.toLocaleString()} USD</span>
            </p>
            <p className="text-xs font-semibold text-emerald-300">
              MRR: <span className="font-mono text-white">${points[hoverIndex].mrrUsd.toLocaleString()} USD</span>
            </p>
            <p className="mt-0.5 text-[10px] text-secondary-400">
              Active Subscribers: {points[hoverIndex].subscriberCount}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Donut Chart: Revenue Breakdown by Tier
 */
export function RevenueDonutChart({ proCount = 0, premiumCount = 0, freeCount = 0 }) {
  const proRev = proCount * 19
  const premiumRev = premiumCount * 49
  const totalRev = proRev + premiumRev || 1

  const proPct = Math.round((proRev / totalRev) * 100)
  const premiumPct = 100 - proPct

  const radius = 64
  const strokeWidth = 18
  const circumference = 2 * Math.PI * radius

  const proDash = (proPct / 100) * circumference
  const premiumDash = (premiumPct / 100) * circumference

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-900 border-b border-secondary-100 pb-4">
        MRR Share by Tier
      </h3>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-around gap-6">
        <div className="relative flex items-center justify-center">
          <svg className="h-44 w-44 -rotate-90 transform" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />
            {/* Pro segment */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#2563eb"
              strokeWidth={strokeWidth}
              strokeDasharray={`${proDash} ${circumference}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            {/* Premium segment */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#9333ea"
              strokeWidth={strokeWidth}
              strokeDasharray={`${premiumDash} ${circumference}`}
              strokeDashoffset={`-${proDash}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>

          <div className="absolute text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-400">Total MRR</p>
            <p className="text-xl font-extrabold text-secondary-950">${totalRev.toLocaleString()}</p>
            <p className="text-[10px] text-secondary-500">USD/mo</p>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3 w-full sm:w-auto">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-primary-100 bg-primary-50/40 p-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary-600" />
              <div>
                <p className="text-xs font-bold text-primary-950">Pro Tier ($19/mo)</p>
                <p className="text-[11px] text-primary-700">{proCount} subscribers</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs font-extrabold text-primary-900">${proRev.toLocaleString()} USD</p>
              <p className="text-[10px] font-bold text-primary-600">{proPct}%</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-purple-100 bg-purple-50/40 p-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-purple-600" />
              <div>
                <p className="text-xs font-bold text-purple-950">Premium Tier ($49/mo)</p>
                <p className="text-[11px] text-purple-700">{premiumCount} subscribers</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs font-extrabold text-purple-900">${premiumRev.toLocaleString()} USD</p>
              <p className="text-[10px] font-bold text-purple-600">{premiumPct}%</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-secondary-200 bg-secondary-50 p-2.5 px-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-secondary-400" />
              <p className="text-xs font-medium text-secondary-600">Free Tier ($0/mo)</p>
            </div>
            <p className="text-xs font-semibold text-secondary-700">{freeCount} users</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Bar Chart: Monthly Paid Subscribers Volume
 */
export function SubscribersBarChart({ data = [] }) {
  const [hoveredMonth, setHoveredMonth] = useState(null)
  const maxSub = Math.max(...data.map((d) => d.subscriberCount || 10), 10) * 1.2

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-secondary-100 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-900">
            Subscriber Growth Volume
          </h3>
          <p className="mt-0.5 text-xs text-secondary-500">Paid customer acquisition pace</p>
        </div>
        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
          Positive Trend
        </span>
      </div>

      <div className="mt-6 flex h-48 items-end gap-3 sm:gap-6 px-2">
        {data.map((m, i) => {
          const heightPct = Math.max((m.subscriberCount / maxSub) * 100, 12)
          const isHovered = hoveredMonth === i
          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center h-full justify-end"
              onMouseEnter={() => setHoveredMonth(i)}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              {/* Tooltip on bar hover */}
              {isHovered && (
                <div className="absolute -top-10 z-20 rounded-lg bg-secondary-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg whitespace-nowrap">
                  {m.subscriberCount} Paid Members
                </div>
              )}

              {/* Visual Bar with animated gradient */}
              <div
                className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                  isHovered
                    ? 'bg-gradient-to-t from-primary-600 to-emerald-400 shadow-md scale-105'
                    : 'bg-gradient-to-t from-primary-500 to-primary-400'
                }`}
                style={{ height: `${heightPct}%` }}
              />

              <p className={`mt-2 text-[11px] ${isHovered ? 'font-bold text-primary-600' : 'text-secondary-500'}`}>
                {m.month.split(' ')[0]}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactFlow, { Background, Controls, Handle, Position } from 'reactflow'
import 'reactflow/dist/style.css'
import { apiRequest } from '../auth.js'
import { BTN_PRIMARY, CARD } from '../components/ui/styles.js'
import { FIELDS, NODE_KINDS, buildRoadmapGraph, isSet } from '../lib/buildRoadmapGraph.js'

/**
 * Roadmap — visual study roadmap & profile completeness trajectory.
 * Integrates real data from GET /profile and GET /discovery.
 */

function RoadmapNode({ data }) {
  const clickable = Boolean(data.action && data.onNavigate)

  if (data.kind === 'core') {
    return (
      <div className="w-64 rounded-2xl border border-secondary-700 bg-gradient-to-b from-secondary-900 via-secondary-900 to-secondary-950 p-4 text-white shadow-xl shadow-secondary-950/20 ring-1 ring-white/10 transition-transform duration-200 hover:scale-[1.02]">
        <Handle position={Position.Left} type="target" className="!h-3 !w-3 !border-2 !border-secondary-900 !bg-primary-500" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/30">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{data.title}</p>
            <p className="truncate text-xs text-secondary-300">{data.subtitle}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-secondary-800 pt-2 text-[11px] font-medium text-secondary-400">
          <span>Student Core</span>
          <span className="rounded-full bg-primary-500/20 px-2 py-0.5 font-semibold text-primary-400">{data.meta}</span>
        </div>
        <Handle position={Position.Right} type="source" className="!h-3 !w-3 !border-2 !border-secondary-900 !bg-primary-500" />
      </div>
    )
  }

  if (data.kind === 'done') {
    return (
      <div className="w-60 rounded-2xl border-2 border-emerald-400/40 bg-white p-3.5 shadow-lg shadow-emerald-500/5 transition-all duration-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10">
        <Handle position={Position.Left} type="target" className="!h-2.5 !w-2.5 !border-2 !border-white !bg-emerald-500" />
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Completed</span>
            <p className="mt-1 text-xs font-semibold text-secondary-900">{data.title}</p>
            <p className="truncate text-xs font-bold text-emerald-700">{data.subtitle}</p>
          </div>
        </div>
        <Handle position={Position.Right} type="source" className="!h-2.5 !w-2.5 !border-2 !border-white !bg-emerald-500" />
      </div>
    )
  }

  if (data.kind === 'gap') {
    return (
      <div className="w-60 rounded-2xl border-2 border-rose-300/60 bg-white p-3.5 shadow-lg shadow-rose-500/5 transition-all duration-200 hover:border-rose-400 hover:shadow-xl hover:shadow-rose-500/10">
        <Handle position={Position.Left} type="target" className="!h-2.5 !w-2.5 !border-2 !border-white !bg-rose-500" />
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">Missing</span>
            <p className="mt-1 text-xs font-semibold text-secondary-900">{data.title}</p>
            <p className="text-xs text-secondary-400">{data.subtitle}</p>
          </div>
        </div>
        <Handle position={Position.Right} type="source" className="!h-2.5 !w-2.5 !border-2 !border-white !bg-rose-500" />
      </div>
    )
  }

  if (data.kind === 'target') {
    return (
      <div className="w-72 rounded-2xl border-2 border-primary-500/50 bg-gradient-to-br from-orange-50/80 via-white to-orange-100/40 p-4 shadow-xl shadow-primary-500/10 transition-all duration-200 hover:border-primary-500">
        <Handle position={Position.Left} type="target" className="!h-3 !w-3 !border-2 !border-white !bg-primary-500" />
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
            Target Match
          </span>
          <span className="text-xs font-bold text-primary-700">{data.price}</span>
        </div>
        <p className="mt-2 text-sm font-bold text-secondary-950">{data.title}</p>
        <p className="text-xs font-medium text-secondary-600">{data.subtitle}</p>
        <div className="mt-2.5 flex items-center justify-between border-t border-orange-200/60 pt-2 text-[11px] text-secondary-500">
          <span>Degree: <strong className="text-secondary-800">{data.level}</strong></span>
          <span className="font-semibold text-primary-600">Affordable Match</span>
        </div>
        <Handle position={Position.Right} type="source" className="!h-3 !w-3 !border-2 !border-white !bg-primary-500" />
      </div>
    )
  }

  // Action / Next Step Node
  return (
    <div className="w-60 rounded-2xl border-2 border-indigo-400/50 bg-white p-3.5 shadow-lg shadow-indigo-500/10 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-600 hover:shadow-xl">
      <Handle position={Position.Left} type="target" className="!h-2.5 !w-2.5 !border-2 !border-white !bg-indigo-500" />
      {clickable ? (
        <button
          className="group w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
          onClick={() => data.onNavigate(data.action)}
          type="button"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">Next Action</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </span>
          </div>
          <p className="mt-1.5 text-xs font-bold text-secondary-950 group-hover:text-indigo-600 transition-colors">{data.title}</p>
          <p className="text-[11px] text-secondary-500">{data.subtitle}</p>
        </button>
      ) : (
        <div>
          <p className="text-xs font-bold text-secondary-950">{data.title}</p>
          <p className="text-[11px] text-secondary-500">{data.subtitle}</p>
        </div>
      )}
      <Handle position={Position.Right} type="source" className="!h-2.5 !w-2.5 !border-2 !border-white !bg-indigo-500" />
    </div>
  )
}

const nodeTypes = { roadmap: RoadmapNode }

export default function Roadmap({ session, onNavigate }) {
  const [profile, setProfile] = useState(null)
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      apiRequest('/profile', { token: session.token }),
      apiRequest('/discovery', { token: session.token }),
    ])
      .then(([profileData, discovery]) => {
        if (!active) return
        setProfile(profileData)
        setPrograms(discovery.programs ?? [])
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [session.token])

  const handleNavigate = useCallback((action) => { onNavigate?.(action.page) }, [onNavigate])

  const graph = useMemo(
    () => (profile ? buildRoadmapGraph(profile, programs) : null),
    [profile, programs],
  )

  const nodes = useMemo(
    () => (graph?.nodes ?? []).map((node) => ({ ...node, data: { ...node.data, onNavigate: handleNavigate } })),
    [graph, handleNavigate],
  )

  const emptyProfile = graph && graph.completed === 0
  const completionPercentage = graph ? Math.round((graph.completed / graph.total) * 100) : 0

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Eye-Catching Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary-900 via-secondary-900 to-secondary-950 p-6 text-white shadow-xl lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary-400">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              <span>Dynamic Study Trajectory</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Your Study <span className="text-primary-400">Roadmap</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary-300 sm:text-base">
              Interactive visual map of your study abroad readiness. Track completed academic milestones, bridge missing requirements, and discover matched programs.
            </p>
          </div>

          {/* Readiness Score Card */}
          <div className="flex shrink-0 flex-col items-start rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:min-w-[240px]">
            <div className="flex w-full items-center justify-between">
              <span className="text-xs font-semibold text-secondary-300">Profile Readiness</span>
              <span className="text-sm font-extrabold text-primary-400">{completionPercentage}%</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="mt-2.5 text-xs text-secondary-400">
              {graph ? `${graph.completed} of ${graph.total} dimensions configured` : 'Loading profile...'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
          {error}
        </div>
      )}

      {emptyProfile && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 shrink-0 text-warning-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <p>Your profile is missing academic details. Fill in your study criteria to unlock university matching.</p>
          </div>
          <button
            className="shrink-0 rounded-lg bg-warning-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-warning-700"
            onClick={() => onNavigate?.('Profile')}
            type="button"
          >
            Complete Profile &rarr;
          </button>
        </div>
      )}

      {/* Legend & Status Bar */}
      {graph && (
        <div aria-live="polite" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-secondary-200/70 bg-white px-5 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary-500">Legend:</span>
            <ul className="flex flex-wrap gap-2" aria-label="Legend">
              {Object.entries(NODE_KINDS).map(([key, kind]) => (
                <li className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${kind.chip}`} key={key}>
                  <span aria-hidden="true" className={`h-2 w-2 rounded-full ${kind.dot}`} />
                  {kind.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-200 bg-secondary-50 px-3 py-1.5 text-xs font-bold text-secondary-700 transition hover:bg-secondary-100"
              onClick={() => onNavigate?.('Profile')}
              type="button"
            >
              <svg className="h-3.5 w-3.5 text-secondary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
              Edit Profile
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-600"
              onClick={() => onNavigate?.('Discovery')}
              type="button"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3" />
              </svg>
              Discovery Catalogue
            </button>
          </div>
        </div>
      )}

      {/* Visual ReactFlow Graph Canvas */}
      {loading ? (
        <div className={`h-[580px] animate-pulse ${CARD}`} aria-label="Loading roadmap" />
      ) : graph ? (
        <div className="relative h-[600px] overflow-hidden rounded-3xl border border-secondary-200/80 bg-slate-50/60 shadow-xl">
          <ReactFlow
            edges={graph.edges}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodeTypes={nodeTypes}
            nodes={nodes}
            nodesConnectable={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#cbd5e1" gap={20} size={1.5} />
            <Controls className="!overflow-hidden !rounded-xl !border !border-secondary-200 !bg-white !shadow-lg" showInteractive={false} />
          </ReactFlow>
        </div>
      ) : (
        <div className={`px-6 py-12 text-center ${CARD}`}>
          <p className="font-semibold text-secondary-950">Roadmap unavailable</p>
          <p className="mt-1 text-sm text-secondary-500">We couldn&rsquo;t load your profile. Try reloading the page.</p>
        </div>
      )}

      {/* Milestone Breakdown & Action Plan Grid */}
      {profile && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-secondary-950">Milestone Breakdown & Action Plan</h2>
            <p className="text-sm text-secondary-500">Track and manage every criteria required to generate personalized university matches.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FIELDS.map((field) => {
              const completed = isSet(profile[field.key])
              const value = profile[field.key]

              return (
                <div
                  key={field.key}
                  className={`flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                    completed
                      ? 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/30 via-white to-white shadow-sm'
                      : 'border-rose-200/80 bg-gradient-to-br from-rose-50/30 via-white to-white shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-secondary-500">{field.label}</span>
                      {completed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                          </svg>
                          Missing
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-base font-extrabold text-secondary-950">
                      {completed ? field.format(value) : 'Not Configured'}
                    </p>
                    <p className="mt-0.5 text-xs text-secondary-500">
                      {completed ? 'Configured in profile' : field.placeholder}
                    </p>
                  </div>

                  <button
                    className={`mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      completed
                        ? 'border border-secondary-200 bg-white text-secondary-700 hover:bg-secondary-50'
                        : 'bg-primary-500 text-white shadow-sm hover:bg-primary-600'
                    }`}
                    onClick={() => onNavigate?.('Profile')}
                    type="button"
                  >
                    {completed ? 'Update Field' : `Set ${field.label}`}
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>

          {/* Matched University Spotlight Card */}
          {graph?.target && (
            <div className="mt-4 flex flex-col justify-between gap-6 rounded-3xl border-2 border-primary-500/30 bg-gradient-to-br from-orange-50/50 via-white to-orange-100/40 p-6 shadow-md md:flex-row md:items-center">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-md shadow-primary-500/20">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                  </svg>
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-800">
                    Optimal Matched Program
                  </div>
                  <h3 className="mt-1 text-lg font-extrabold text-secondary-950">{graph.target.name}</h3>
                  <p className="text-sm font-medium text-secondary-600">
                    {graph.target.university} · {graph.target.country}
                  </p>
                  <p className="mt-1 text-xs text-secondary-500">
                    Annual Tuition: <strong className="text-primary-600">${graph.target.annualTuitionUsd.toLocaleString('en-US')} USD/yr</strong> · Level: {graph.target.level}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button
                  className={`${BTN_PRIMARY} shadow-lg shadow-primary-500/20`}
                  onClick={() => onNavigate?.('Discovery')}
                  type="button"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3" />
                  </svg>
                  Explore in Discovery
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactFlow, { Background, Controls, Handle, Position } from 'reactflow'
import 'reactflow/dist/style.css'
import { apiRequest } from '../auth.js'
import { CARD } from '../components/ui/styles.js'
import { NODE_KINDS, buildRoadmapGraph } from '../lib/buildRoadmapGraph.js'

/**
 * Roadmap — a node graph of the student's profile completeness and what to do next.
 *
 * Data comes only from endpoints that are actually implemented: GET /profile (real as
 * of Phase A) and GET /discovery (already real). Nothing here touches the still-stub
 * RecommendationService.
 */

const nodeStyles = {
  core: 'border-secondary-800 bg-secondary-800 text-white',
  done: 'border-success-500/40 bg-success-50 text-secondary-950',
  gap: 'border-danger-500/40 bg-danger-50 text-secondary-950',
  target: 'border-primary-500/40 bg-primary-50 text-secondary-950',
  action: 'border-accent-500/40 bg-accent-50 text-secondary-950',
}

function RoadmapNode({ data }) {
  const clickable = Boolean(data.action && data.onNavigate)
  const body = (
    <>
      <p className={`text-sm font-bold ${data.kind === 'core' ? 'text-white' : 'text-secondary-950'}`}>{data.title}</p>
      {data.subtitle && (
        <p className={`mt-0.5 text-xs ${data.kind === 'core' ? 'text-secondary-200' : 'text-secondary-500'}`}>{data.subtitle}</p>
      )}
    </>
  )

  return (
    <div className={`w-52 rounded-xl border-2 px-3 py-2.5 shadow-sm ${nodeStyles[data.kind]}`}>
      <Handle position={Position.Left} type="target" className="!h-2 !w-2 !border-0 !bg-secondary-300" />
      {clickable ? (
        <button
          className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1"
          onClick={() => data.onNavigate(data.action)}
          type="button"
        >
          {body}
          <span className="mt-1 inline-block text-xs font-semibold text-accent-600">Go &rarr;</span>
        </button>
      ) : body}
      <Handle position={Position.Right} type="source" className="!h-2 !w-2 !border-0 !bg-secondary-300" />
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

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Roadmap</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-secondary-950">Your study roadmap</h1>
        <p className="mt-2 text-secondary-500">
          What you&rsquo;ve completed, what&rsquo;s still missing, and the next step for each gap.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
          {error}
        </div>
      )}

      {graph && (
        <div aria-live="polite" className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-secondary-700">
            {graph.completed} of {graph.total} profile details completed
            {graph.target ? ` · best match: ${graph.target.name}` : ''}
          </p>
          <ul className="flex flex-wrap gap-2" aria-label="Legend">
            {Object.entries(NODE_KINDS).map(([key, kind]) => (
              <li className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${kind.chip}`} key={key}>
                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${kind.dot}`} />
                {kind.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {emptyProfile && (
        <div className="mb-4 rounded-2xl border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          Your profile is empty, so everything shows as missing. Fill in your study details and
          these turn green.{' '}
          <button className="font-bold underline" onClick={() => onNavigate?.('Profile')} type="button">
            Open Profile
          </button>
        </div>
      )}

      {graph?.noTargetReason && (
        <div className="mb-4 rounded-2xl border border-secondary-200 bg-white px-4 py-3 text-sm text-secondary-600">
          No target match yet — {graph.noTargetReason}
        </div>
      )}

      {loading ? (
        <div className={`h-[560px] animate-pulse ${CARD}`} aria-label="Loading roadmap" />
      ) : graph ? (
        <div className={`h-[560px] overflow-hidden ${CARD}`}>
          <ReactFlow
            edges={graph.edges}
            fitView
            nodeTypes={nodeTypes}
            nodes={nodes}
            nodesConnectable={false}
            proOptions={{ hideAttribution: false }}
          >
            <Background color="#d3dae4" gap={18} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      ) : (
        <div className={`px-6 py-12 text-center ${CARD}`}>
          <p className="font-semibold text-secondary-950">Roadmap unavailable</p>
          <p className="mt-1 text-sm text-secondary-500">We couldn&rsquo;t load your profile. Try reloading the page.</p>
        </div>
      )}
    </div>
  )
}

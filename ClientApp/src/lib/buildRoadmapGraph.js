/**
 * Derives the roadmap graph from real data only.
 *
 * Every node traces to an endpoint that actually exists:
 *   - Profile Core + completed/gap nodes  -> GET /profile   (real since Phase A)
 *   - Target match node                   -> GET /discovery (already real)
 *
 * Nothing here calls RecommendationService, which is still a stub. See pickTargetMatch
 * below for exactly what the "match" means and what it does not.
 */

export const NODE_KINDS = {
  core: { label: 'Profile core', chip: 'bg-secondary-800 text-white', dot: 'bg-secondary-800' },
  done: { label: 'Completed', chip: 'bg-success-50 text-success-700', dot: 'bg-success-500' },
  gap: { label: 'Missing', chip: 'bg-danger-50 text-danger-700', dot: 'bg-danger-500' },
  target: { label: 'Target match', chip: 'bg-primary-50 text-primary-700', dot: 'bg-primary-500' },
  action: { label: 'Next step', chip: 'bg-accent-50 text-accent-600', dot: 'bg-accent-500' },
}

/** The four study fields the roadmap tracks, in display order. */
const FIELDS = [
  { key: 'cgpa', label: 'CGPA', format: (value) => `CGPA ${value}` },
  { key: 'major', label: 'Major', format: (value) => `${value}` },
  { key: 'budgetUsd', label: 'Budget', format: (value) => `Budget $${Number(value).toLocaleString('en-US')}` },
  { key: 'degreeLevel', label: 'Degree level', format: (value) => `${value}` },
]

const isSet = (value) => value !== null && value !== undefined && value !== ''

/**
 * Picks a target program for the profile.
 *
 * ── WHAT THIS IS ─────────────────────────────────────────────────────────────────
 * A deliberately simple client-side rule over the programs GET /discovery already
 * returned: keep programs whose Level matches the student's DegreeLevel and whose
 * AnnualTuitionUsd is within budget, then take the cheapest. If no budget is set,
 * budget is not applied; if no degree level is set, level is not applied.
 *
 * ── WHAT THIS IS NOT ─────────────────────────────────────────────────────────────
 * This is NOT a recommendation engine and does NOT call RecommendationService, which
 * remains a stub returning an empty list. There is no scoring model, no ranking
 * beyond price, and no use of CGPA or Major in the match — those are shown as profile
 * completeness only. Replacing this with real matching is separate future work.
 */
export function pickTargetMatch(profile, programs) {
  if (!programs?.length) return null

  const affordable = programs.filter((program) => {
    const levelOk = !isSet(profile.degreeLevel) || program.level === profile.degreeLevel
    const budgetOk = !isSet(profile.budgetUsd) || program.annualTuitionUsd <= Number(profile.budgetUsd)
    return levelOk && budgetOk
  })

  if (affordable.length === 0) return null
  return [...affordable].sort((a, b) => a.annualTuitionUsd - b.annualTuitionUsd)[0]
}

/**
 * Builds reactflow nodes + edges.
 * Returns { nodes, edges, completed, total, target } — counts drive the summary line.
 */
export function buildRoadmapGraph(profile, programs) {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Your profile'
  const nodes = []
  const edges = []

  const CORE_X = 340
  const CORE_Y = 260

  nodes.push({
    id: 'core',
    type: 'roadmap',
    position: { x: CORE_X, y: CORE_Y },
    data: { kind: 'core', title: name, subtitle: profile.email },
    draggable: false,
  })

  // One node per tracked field: completed (green) or gap (red).
  const completedFields = []
  const gapFields = []
  FIELDS.forEach((field) => {
    (isSet(profile[field.key]) ? completedFields : gapFields).push(field)
  })

  completedFields.forEach((field, index) => {
    const id = `done-${field.key}`
    nodes.push({
      id,
      type: 'roadmap',
      position: { x: 20, y: 60 + index * 110 },
      data: { kind: 'done', title: field.label, subtitle: field.format(profile[field.key]) },
    })
    edges.push({ id: `e-${id}`, source: id, target: 'core', animated: false, style: { strokeDasharray: '6 4' }, type: 'smoothstep' })
  })

  gapFields.forEach((field, index) => {
    const id = `gap-${field.key}`
    nodes.push({
      id,
      type: 'roadmap',
      position: { x: 660, y: 40 + index * 110 },
      data: { kind: 'gap', title: field.label, subtitle: 'Not set yet' },
    })
    edges.push({ id: `e-${id}`, source: 'core', target: id, style: { strokeDasharray: '6 4' }, type: 'smoothstep' })

    // Every gap gets exactly one real next step: the Profile page field that fills it.
    const actionId = `action-${field.key}`
    nodes.push({
      id: actionId,
      type: 'roadmap',
      position: { x: 960, y: 40 + index * 110 },
      data: {
        kind: 'action',
        title: `Add your ${field.label.toLowerCase()}`,
        subtitle: 'Opens Profile',
        action: { page: 'Profile', focus: field.key },
      },
    })
    edges.push({ id: `e-${actionId}`, source: id, target: actionId, style: { strokeDasharray: '6 4' }, type: 'smoothstep' })
  })

  // Target match, computed from the real Discovery catalogue.
  const target = pickTargetMatch(profile, programs)
  if (target) {
    nodes.push({
      id: 'target',
      type: 'roadmap',
      position: { x: CORE_X, y: CORE_Y + 210 },
      data: {
        kind: 'target',
        title: target.name,
        subtitle: `${target.university} · ${target.country} · $${target.annualTuitionUsd.toLocaleString('en-US')}/yr`,
      },
    })
    edges.push({ id: 'e-target', source: 'core', target: 'target', style: { strokeDasharray: '6 4' }, type: 'smoothstep' })

    // Saving a program is a real, working action (Discovery's shortlist).
    nodes.push({
      id: 'action-shortlist',
      type: 'roadmap',
      position: { x: CORE_X + 300, y: CORE_Y + 210 },
      data: {
        kind: 'action',
        title: 'Shortlist a program',
        subtitle: 'Opens Discovery',
        action: { page: 'Discovery' },
      },
    })
    edges.push({ id: 'e-action-shortlist', source: 'target', target: 'action-shortlist', style: { strokeDasharray: '6 4' }, type: 'smoothstep' })
  }

  // Deliberately no nodes for Documents, Visa, or Scholarships: those services are
  // still stubs, so a "next step" pointing at them would lead nowhere.

  return {
    nodes,
    edges,
    completed: completedFields.length,
    total: FIELDS.length,
    target,
    noTargetReason: !programs?.length
      ? 'No programs loaded.'
      : !target
        ? 'No program in the catalogue matches your degree level and budget yet.'
        : null,
  }
}

/**
 * Derives the roadmap graph from real data only.
 *
 * Every node traces to an endpoint that actually exists:
 *   - Profile Core + completed/gap nodes  -> GET /profile   (real since Phase A)
 *   - Target match node                   -> GET /discovery (already real)
 */

export const NODE_KINDS = {
  core: { label: 'Student Profile', chip: 'bg-secondary-900 text-white border border-secondary-700', dot: 'bg-primary-500' },
  done: { label: 'Completed', chip: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  gap: { label: 'Missing Info', chip: 'bg-rose-50 text-rose-700 border border-rose-200', dot: 'bg-rose-500' },
  target: { label: 'Target Match', chip: 'bg-primary-50 text-primary-700 border border-primary-200', dot: 'bg-primary-500' },
  action: { label: 'Next Action', chip: 'bg-indigo-50 text-indigo-700 border border-indigo-200', dot: 'bg-indigo-500' },
}

/** The four study fields the roadmap tracks, in display order. */
export const FIELDS = [
  { key: 'cgpa', label: 'CGPA Score', placeholder: 'e.g. 3.85 / 4.00', format: (value) => `CGPA ${value}` },
  { key: 'major', label: 'Intended Major', placeholder: 'e.g. Computer Science', format: (value) => `${value}` },
  { key: 'budgetUsd', label: 'Annual Budget', placeholder: 'e.g. $25,000 USD', format: (value) => `$${Number(value).toLocaleString('en-US')}/yr` },
  { key: 'degreeLevel', label: 'Degree Target', placeholder: 'e.g. Masters, Bachelors', format: (value) => `${value}` },
]

export const isSet = (value) => value !== null && value !== undefined && value !== ''

/**
 * Picks a target program for the profile from GET /discovery programs.
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
 * Builds reactflow nodes + edges with enhanced positioning, custom styles, and responsive spacing.
 */
export function buildRoadmapGraph(profile, programs) {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Your Profile'
  const nodes = []
  const edges = []

  const completedFields = []
  const gapFields = []
  FIELDS.forEach((field) => {
    (isSet(profile[field.key]) ? completedFields : gapFields).push(field)
  })

  const CORE_X = 380
  const CORE_Y = 220

  // Core Student Node
  nodes.push({
    id: 'core',
    type: 'roadmap',
    position: { x: CORE_X, y: CORE_Y },
    data: {
      kind: 'core',
      title: name,
      subtitle: profile.email || 'Student Account',
      meta: `${completedFields.length} of ${FIELDS.length} completed`,
    },
    draggable: false,
  })

  // Completed Nodes (Positioned on the Left)
  completedFields.forEach((field, index) => {
    const id = `done-${field.key}`
    const yPos = 60 + index * 125
    nodes.push({
      id,
      type: 'roadmap',
      position: { x: 40, y: yPos },
      data: {
        kind: 'done',
        title: field.label,
        subtitle: field.format(profile[field.key]),
        fieldKey: field.key,
      },
    })
    edges.push({
      id: `e-${id}`,
      source: id,
      target: 'core',
      animated: true,
      type: 'smoothstep',
      style: { stroke: '#10b981', strokeWidth: 2 },
    })
  })

  // Gap Nodes (Positioned in Center-Right) and Action Nodes (Positioned on Far-Right)
  gapFields.forEach((field, index) => {
    const id = `gap-${field.key}`
    const yPos = 40 + index * 130
    nodes.push({
      id,
      type: 'roadmap',
      position: { x: 740, y: yPos },
      data: {
        kind: 'gap',
        title: field.label,
        subtitle: 'Profile requirement missing',
        fieldKey: field.key,
      },
    })
    edges.push({
      id: `e-${id}`,
      source: 'core',
      target: id,
      type: 'smoothstep',
      style: { stroke: '#f43f5e', strokeWidth: 2, strokeDasharray: '6 4' },
    })

    const actionId = `action-${field.key}`
    nodes.push({
      id: actionId,
      type: 'roadmap',
      position: { x: 1040, y: yPos },
      data: {
        kind: 'action',
        title: `Set ${field.label}`,
        subtitle: 'Update in Profile',
        badge: 'Recommended',
        action: { page: 'Profile', focus: field.key },
      },
    })
    edges.push({
      id: `e-${actionId}`,
      source: id,
      target: actionId,
      animated: true,
      type: 'smoothstep',
      style: { stroke: '#6366f1', strokeWidth: 2 },
    })
  })

  // Target Program Match
  const target = pickTargetMatch(profile, programs)
  if (target) {
    nodes.push({
      id: 'target',
      type: 'roadmap',
      position: { x: CORE_X - 40, y: CORE_Y + 230 },
      data: {
        kind: 'target',
        title: target.name,
        university: target.university,
        country: target.country,
        subtitle: `${target.university} · ${target.country}`,
        price: `$${target.annualTuitionUsd.toLocaleString('en-US')}/yr`,
        level: target.level,
      },
    })
    edges.push({
      id: 'e-target',
      source: 'core',
      target: 'target',
      animated: true,
      type: 'smoothstep',
      style: { stroke: '#ff6b3d', strokeWidth: 2.5 },
    })

    nodes.push({
      id: 'action-shortlist',
      type: 'roadmap',
      position: { x: CORE_X + 340, y: CORE_Y + 230 },
      data: {
        kind: 'action',
        title: 'Explore Discovery',
        subtitle: 'View full catalogue & shortlist',
        badge: 'Catalogue',
        action: { page: 'Discovery' },
      },
    })
    edges.push({
      id: 'e-action-shortlist',
      source: 'target',
      target: 'action-shortlist',
      animated: true,
      type: 'smoothstep',
      style: { stroke: '#ff6b3d', strokeWidth: 2 },
    })
  }

  return {
    nodes,
    edges,
    completed: completedFields.length,
    total: FIELDS.length,
    completedFields,
    gapFields,
    target,
    noTargetReason: !programs?.length
      ? 'No programs available in catalogue.'
      : !target
        ? 'No program in the catalogue matches your current degree level and budget yet.'
        : null,
  }
}

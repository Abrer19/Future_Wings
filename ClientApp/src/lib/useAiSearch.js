import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Natural-language ranking of the Discovery programs already in state.
 *
 * The model runs in a Web Worker (see src/workers/classifyWorker.js). This hook owns
 * the worker's lifetime and turns its message protocol into a promise-returning
 * `classify()`.
 *
 * ── SCALING LIMIT — read before extending ────────────────────────────────────────
 * This is zero-shot classification: the model does one forward pass PER CANDIDATE
 * LABEL. With the current seeded catalogue (6 programs) that is 6 passes and feels
 * instant. It is linear in catalogue size and will not scale.
 *
 * Past roughly a hundred programs this must be replaced by embedding + cosine
 * similarity: embed each program once, cache the vectors, embed only the query at
 * search time, and rank by dot product. That is a DIFFERENT ARCHITECTURE (a
 * feature-extraction model, a stored vector index, an ANN search), not a tuning knob
 * on this one. MAX_CANDIDATES below is a guard rail, not a solution.
 * ─────────────────────────────────────────────────────────────────────────────────
 */

// Hard cap on labels sent per request. See the scaling note above.
const MAX_CANDIDATES = 50

/** @typedef {'idle'|'loading-model'|'ready'|'classifying'|'error'} AiSearchStatus */

export function useAiSearch() {
  const [status, setStatus] = useState(/** @type {AiSearchStatus} */ ('idle'))
  const [error, setError] = useState('')
  const workerRef = useRef(null)
  const pendingRef = useRef(new Map())
  const nextIdRef = useRef(0)
  const modelReadyRef = useRef(false)

  /**
   * Creates the worker on first use rather than on mount, so visiting Discovery
   * without using this feature costs nothing.
   */
  const ensureWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current

    // new URL(..., import.meta.url) is what lets Vite discover and bundle the
    // worker in both dev and production build.
    const worker = new Worker(new URL('../workers/classifyWorker.js', import.meta.url), { type: 'module' })

    worker.addEventListener('message', (event) => {
      const { id, type, status: workerStatus, scores, message } = event.data ?? {}
      const pending = pendingRef.current.get(id)

      if (type === 'status') {
        if (workerStatus === 'ready') modelReadyRef.current = true
        setStatus(workerStatus === 'ready' ? 'classifying' : workerStatus)
        return
      }
      if (type === 'result') {
        pendingRef.current.delete(id)
        setStatus('ready')
        pending?.resolve(scores)
        return
      }
      if (type === 'error') {
        pendingRef.current.delete(id)
        setStatus('error')
        setError(message)
        pending?.reject(new Error(message))
      }
    })

    worker.addEventListener('error', (event) => {
      setStatus('error')
      setError(event?.message ?? 'The AI search worker failed to start.')
      for (const { reject } of pendingRef.current.values()) {
        reject(new Error('The AI search worker failed to start.'))
      }
      pendingRef.current.clear()
    })

    workerRef.current = worker
    return worker
  }, [])

  // Tear the worker down on unmount. The pending map is captured into a local so the
  // cleanup does not read a ref that may have changed by the time it runs.
  useEffect(() => {
    const pending = pendingRef.current
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
      pending.clear()
    }
  }, [])

  /**
   * Ranks `programs` against a natural-language `query`.
   * Resolves to the programs sorted by score descending, each with `aiScore` attached.
   * Rejects if the model cannot load — callers should fall back to the existing search.
   */
  const classify = useCallback(async (query, programs) => {
    if (!query.trim() || programs.length === 0) return []

    let worker
    try {
      worker = ensureWorker()
    } catch (constructionError) {
      // No module-worker support, or the chunk is blocked. The feature is unavailable,
      // but Discovery's keyword/filter search is untouched and keeps working.
      setStatus('error')
      setError(constructionError?.message ?? 'This browser cannot run the smart search.')
      throw new Error('Smart search is unavailable in this browser.')
    }

    const candidates = programs.slice(0, MAX_CANDIDATES)
    // Label text is what the model actually compares the query against, so it carries
    // the fields a user would describe: subject, institution, place, level, and tags
    // (which hold signals like "Low tuition" and "AI & Data").
    const labelFor = (program) => {
      const tags = Array.isArray(program.tags) && program.tags.length ? ` — ${program.tags.join(', ')}` : ''
      return `${program.name} at ${program.university}, ${program.country} (${program.level})${tags}`
    }

    const labels = candidates.map(labelFor)
    const id = nextIdRef.current++

    setError('')
    setStatus(modelReadyRef.current ? 'classifying' : 'loading-model')

    const scores = await new Promise((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject })
      worker.postMessage({ id, type: 'classify', sequence: query.trim(), labels })
    })

    const byLabel = new Map(scores.map((entry) => [entry.label, entry.score]))
    return candidates
      .map((program) => ({ ...program, aiScore: byLabel.get(labelFor(program)) ?? 0 }))
      .sort((a, b) => b.aiScore - a.aiScore)
  }, [ensureWorker])

  return { classify, status, error, maxCandidates: MAX_CANDIDATES }
}

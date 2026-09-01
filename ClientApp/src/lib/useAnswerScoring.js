import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Scores an interview answer against a reference answer and a rubric of key points.
 *
 * ── METHOD, AND WHY ──────────────────────────────────────────────────────────────
 * Automated short-answer grading research is consistent on one point: cosine
 * similarity to a single reference answer measures whether the student wrote about
 * the same TOPIC, not whether the answer is GOOD. Embeddings "prioritise thematic
 * similarity over evaluative alignment with the rubric". Rubric-based work (key-point
 * coverage) reports better agreement with human grades, and hybrids of the two beat
 * either alone.
 *
 * So the score is:
 *     0.35 x similarity-to-reference   +   0.65 x key-point coverage
 *
 * Coverage carries more weight because it is the evaluative signal, and because it is
 * the part that produces actionable feedback — we can name the points that were
 * missed, which a single similarity number never can.
 *
 * A length floor stops a fluent one-liner scoring highly on similarity alone.
 *
 * ── LIMITATIONS — read before trusting a number ──────────────────────────────────
 * This is a practice aid, not an assessment. all-MiniLM-L6-v2 is a small general
 * encoder, not fine-tuned on interview data; it has no ground-truth human grades
 * behind it, it cannot detect factual falsehood, and it handles negation poorly (a
 * known weakness of sentence encoders), so "I have no funding" and "I have funding"
 * can look similar to it. Treat the score as a rough completeness check.
 */

const SIMILARITY_WEIGHT = 0.35
const COVERAGE_WEIGHT = 0.65
/**
 * Cosine above which a key point counts as addressed.
 *
 * Calibrated against real MiniLM output, not guessed. Measured max-sentence cosines
 * for a weak / medium / strong answer to the motivation question were:
 *   weak   0.368 0.205 0.241 0.290
 *   medium 0.421 0.544 0.351 0.121
 *   strong 0.488 0.368 0.576 0.161
 * 0.35 separates them in the right order; higher starts dropping points the strong
 * answer genuinely covers.
 */
const KEY_POINT_THRESHOLD = 0.35
/** Below this many words, the score is capped — embeddings flatter short answers. */
const MIN_WORDS_FOR_FULL_CREDIT = 25

const cosine = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0)

/**
 * Splits an answer into sentences for per-sentence matching.
 *
 * This matters more than it looks. A single embedding of a long answer averages every
 * sentence together and dilutes each point: for a strong 84-word answer the career-goal
 * rubric point scored 0.271 against the whole answer but 0.576 against its best
 * sentence. Whole-answer matching made a good answer look worse than a one-line one.
 */
const splitSentences = (text) => text
  .split(/(?<=[.!?])\s+/)
  .map((sentence) => sentence.trim())
  .filter((sentence) => sentence.split(/\s+/).filter(Boolean).length >= 3)

/** MiniLM cosines for related text sit roughly in 0.15–0.75; stretch that to 0–1. */
const normalise = (similarity) => Math.max(0, Math.min(1, (similarity - 0.15) / 0.55))

export function useAnswerScoring() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const workerRef = useRef(null)
  const pendingRef = useRef(new Map())
  const nextIdRef = useRef(0)
  const readyRef = useRef(false)

  const ensureWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current
    const worker = new Worker(new URL('../workers/embedWorker.js', import.meta.url), { type: 'module' })

    worker.addEventListener('message', (event) => {
      const { id, type, status: workerStatus, vectors, message } = event.data ?? {}
      const pending = pendingRef.current.get(id)
      if (type === 'status') { setStatus(workerStatus); return }
      if (type === 'result') {
        pendingRef.current.delete(id)
        readyRef.current = true
        setStatus('ready')
        pending?.resolve(vectors)
        return
      }
      if (type === 'error') {
        pendingRef.current.delete(id)
        setStatus('error')
        setError(message)
        pending?.reject(new Error(message))
      }
    })

    worker.addEventListener('error', () => {
      setStatus('error')
      setError('The scoring model failed to start.')
      for (const { reject } of pendingRef.current.values()) reject(new Error('Scoring unavailable.'))
      pendingRef.current.clear()
    })

    workerRef.current = worker
    return worker
  }, [])

  useEffect(() => {
    const pending = pendingRef.current
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
      pending.clear()
    }
  }, [])

  const embed = useCallback((texts) => {
    const worker = ensureWorker()
    const id = nextIdRef.current++
    setStatus(readyRef.current ? 'scoring' : 'loading-model')
    return new Promise((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject })
      worker.postMessage({ id, type: 'embed', texts })
    })
  }, [ensureWorker])

  /**
   * Returns { score, similarity, coverage, covered[], missed[], wordCount, capped }.
   */
  const scoreAnswer = useCallback(async (answer, question) => {
    const trimmed = answer.trim()
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length
    if (wordCount === 0) throw new Error('Write an answer before scoring it.')

    setError('')
    const sentences = splitSentences(trimmed)
    const probes = question.keyPoints.map((point) => point.probe)

    // [answer, reference, ...probes, ...sentences] in one batch — one worker round trip.
    const vectors = await embed([trimmed, question.reference, ...probes, ...sentences])
    const answerVector = vectors[0]
    const referenceVector = vectors[1]
    const probeVectors = vectors.slice(2, 2 + probes.length)
    const sentenceVectors = vectors.slice(2 + probes.length)

    const similarity = normalise(cosine(answerVector, referenceVector))

    // Best-matching sentence per rubric point, falling back to the whole answer when
    // the response is a single short fragment.
    const perPoint = question.keyPoints.map((point, index) => {
      const probeVector = probeVectors[index]
      const best = sentenceVectors.length
        ? Math.max(...sentenceVectors.map((vector) => cosine(vector, probeVector)))
        : cosine(answerVector, probeVector)
      return { point, similarity: best }
    })
    const covered = perPoint.filter((item) => item.similarity >= KEY_POINT_THRESHOLD)
    const missed = perPoint.filter((item) => item.similarity < KEY_POINT_THRESHOLD)
    const coverage = question.keyPoints.length ? covered.length / question.keyPoints.length : 0

    let score = Math.round(100 * (SIMILARITY_WEIGHT * similarity + COVERAGE_WEIGHT * coverage))

    // Short answers cannot cover four rubric points, however well phrased.
    const capped = wordCount < MIN_WORDS_FOR_FULL_CREDIT
    if (capped) score = Math.min(score, 55)

    setStatus('ready')
    return {
      score,
      similarity: Math.round(similarity * 100),
      coverage: Math.round(coverage * 100),
      covered: covered.map((item) => item.point.label),
      missed: missed.map((item) => item.point.label),
      wordCount,
      capped,
    }
  }, [embed])

  return { scoreAnswer, status, error }
}

export const scoreBand = (score) =>
  score >= 75 ? { label: 'Strong', className: 'bg-success-50 text-success-700' }
    : score >= 50 ? { label: 'Developing', className: 'bg-warning-50 text-warning-700' }
      : { label: 'Needs work', className: 'bg-danger-50 text-danger-700' }

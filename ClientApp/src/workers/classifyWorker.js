/**
 * Zero-shot classification worker for Discovery's natural-language search.
 *
 * Runs off the main thread because the first call downloads several MB of model
 * weights and inference is CPU-bound — both would visibly freeze the UI otherwise.
 *
 * Protocol
 *   in : { id, type: 'classify', sequence, labels }
 *   out: { id, type: 'status', status: 'loading-model' | 'ready' }
 *        { id, type: 'result', scores: [{ label, score }] }
 *        { id, type: 'error',  message }
 */
import { env, pipeline } from '@xenova/transformers'

const MODEL_ID = 'Xenova/distilbert-base-uncased-mnli'

// Weights come from the Hugging Face CDN; there is no local model directory to check.
env.allowLocalModels = false
// Cache API storage so the weights are fetched once per browser, not once per page load.
// This is transformers.js's default when the Cache API exists — set explicitly so the
// intent survives anyone changing defaults.
env.useBrowserCache = true

/**
 * Module-scoped so the pipeline is constructed once for the worker's lifetime.
 * Storing the *promise* (not the resolved value) also collapses concurrent first
 * calls into a single download rather than racing several.
 */
let classifierPromise = null

function getClassifier() {
  classifierPromise ??= pipeline('zero-shot-classification', MODEL_ID, {
    // v2.x of transformers.js spells this `quantized`; `dtype: 'q8'` is the v3
    // (@huggingface/transformers) API and is silently ignored here. This loads the
    // ~8-bit ONNX weights instead of the ~250MB fp32 ones.
    quantized: true,
  })
  return classifierPromise
}

self.addEventListener('message', async (event) => {
  const { id, type, sequence, labels } = event.data ?? {}
  if (type !== 'classify') return

  try {
    const cold = classifierPromise === null
    if (cold) self.postMessage({ id, type: 'status', status: 'loading-model' })

    const classifier = await getClassifier()
    if (cold) self.postMessage({ id, type: 'status', status: 'ready' })

    // multi_label so each program is scored independently — a query can genuinely
    // match several programs, and they are not mutually exclusive categories.
    const output = await classifier(sequence, labels, { multi_label: true })

    // Normalise: transformers.js returns parallel `labels`/`scores` arrays.
    const scores = output.labels.map((label, index) => ({ label, score: output.scores[index] }))
    self.postMessage({ id, type: 'result', scores })
  } catch (error) {
    // Reset so a transient failure (offline, blocked CDN) can be retried rather than
    // permanently caching a rejected promise.
    classifierPromise = null
    self.postMessage({ id, type: 'error', message: error?.message ?? 'Classification failed.' })
  }
})

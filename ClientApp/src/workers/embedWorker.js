/**
 * Sentence-embedding worker for interview answer scoring.
 *
 * Model: Xenova/all-MiniLM-L6-v2 (~22M params, quantized ONNX ~23MB). This is the
 * model the automated short-answer-grading literature uses most often for exactly
 * this task, and it is small enough to run in a browser.
 *
 * Protocol
 *   in : { id, type: 'embed', texts: string[] }
 *   out: { id, type: 'status', status: 'loading-model' }
 *        { id, type: 'result', vectors: number[][] }
 *        { id, type: 'error',  message }
 */
import { env, pipeline } from '@xenova/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

let extractorPromise = null

function getExtractor() {
  extractorPromise ??= pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true })
  return extractorPromise
}

self.addEventListener('message', async (event) => {
  const { id, type, texts } = event.data ?? {}
  if (type !== 'embed') return

  try {
    const cold = extractorPromise === null
    if (cold) self.postMessage({ id, type: 'status', status: 'loading-model' })

    const extractor = await getExtractor()

    // Mean pooling + L2 normalisation is what makes the raw cosine of two outputs a
    // usable similarity; without normalisation the magnitudes are not comparable.
    const output = await extractor(texts, { pooling: 'mean', normalize: true })

    // tolist() gives [n, dim] for a batch and [dim] for a single input.
    const nested = output.tolist()
    const vectors = Array.isArray(nested[0]) ? nested : [nested]

    self.postMessage({ id, type: 'result', vectors })
  } catch (error) {
    extractorPromise = null
    self.postMessage({ id, type: 'error', message: error?.message ?? 'Scoring failed.' })
  }
})

import { useCallback, useEffect, useRef, useState } from 'react'
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'

/**
 * Optional camera feedback while practising.
 *
 * ── WHAT THIS REPORTS, AND WHAT IT REFUSES TO ────────────────────────────────────
 * Geometry only: are you in shot, are you centred, are you steady, are you a sensible
 * distance from the camera. It uses the face BOUNDING BOX and nothing else — no
 * landmarks, no expression, no classification of the person.
 *
 * It does not infer emotion, confidence, personality or competence, and must not be
 * extended to:
 *
 *  1. Validity — Barrett et al. (2019, Psychological Science in the Public Interest)
 *     found facial movements are not reliably diagnostic of emotional state across
 *     person, context and culture.
 *  2. Law — EU AI Act Article 5(1)(f) prohibits AI inferring emotions in workplace AND
 *     education settings (in force since Feb 2025). Illinois' AI Video Interview Act
 *     requires notice and consent where AI evaluates facial expressions; NYC Local
 *     Law 144 requires bias audits for automated employment decision tools.
 *
 * ── WHY MEDIAPIPE AND NOT A TRANSFORMERS.JS DETECTOR ─────────────────────────────
 * This first used Xenova/yolos-tiny through transformers.js. It worked but measured
 * ~40 SECONDS per frame in a headless browser: YOLOS is a DETR-style general detector
 * with 100 object queries, which is enormous overkill for "where is the face". The
 * MediaPipe short-range face detector (BlazeFace) is purpose-built for this and runs
 * at video framerate, so feedback arrives in seconds rather than minutes.
 *
 * Consent is explicit — nothing starts until startCamera() is called from a click.
 * Frames are analysed in memory and discarded; none are uploaded or stored.
 */

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'

/** How often to sample. The detector is fast, so this is a UX choice, not a limit. */
const SAMPLE_TICK_MS = 700
/** Enough samples to say something meaningful without making the user wait. */
const MIN_SAMPLES = 4

export function useFramingCheck() {
  const [status, setStatus] = useState('off') // off | starting | loading-model | watching | error
  const [error, setError] = useState('')
  const [samples, setSamples] = useState([])
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const detectorRef = useRef(null)
  const timerRef = useRef(null)
  const busyRef = useRef(false)

  const stopCamera = useCallback(() => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    busyRef.current = false
    if (videoRef.current) videoRef.current.srcObject = null
    detectorRef.current?.close?.()
    detectorRef.current = null
    setStatus('off')
  }, [])

  useEffect(() => stopCamera, [stopCamera])

  const startCamera = useCallback(async () => {
    setError('')
    setSamples([])
    setStatus('starting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play().catch(() => {})
      }

      setStatus('loading-model')
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE)
      // GPU where available; MediaPipe falls back to CPU on its own if not.
      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.5,
      })
      detectorRef.current = detector
      setStatus('watching')

      timerRef.current = window.setInterval(() => {
        const element = videoRef.current
        const activeDetector = detectorRef.current
        if (busyRef.current || !element || !activeDetector || element.readyState < 2) return
        if (!element.videoWidth || !element.videoHeight) return

        busyRef.current = true
        try {
          const { detections } = activeDetector.detectForVideo(element, performance.now())
          const face = (detections ?? [])
            .map((detection) => detection.boundingBox)
            .filter(Boolean)
            .sort((a, b) => b.width * b.height - a.width * a.height)[0]

          if (!face) {
            setSamples((current) => [...current.slice(-59), { present: false, centerOffset: null, coverage: 0 }])
          } else {
            const midX = (face.originX + face.width / 2) / element.videoWidth
            const midY = (face.originY + face.height / 2) / element.videoHeight
            setSamples((current) => [...current.slice(-59), {
              present: true,
              // 0 = dead centre, 1 = at the edge of frame.
              centerOffset: Math.hypot(midX - 0.5, midY - 0.5) * 2,
              // Share of the frame the face occupies — proxy for distance.
              coverage: (face.width * face.height) / (element.videoWidth * element.videoHeight),
            }])
          }
        } catch (detectError) {
          setStatus('error')
          setError(detectError?.message ?? 'The camera check failed while running.')
        } finally {
          busyRef.current = false
        }
      }, SAMPLE_TICK_MS)
    } catch (mediaError) {
      setStatus('error')
      setError(mediaError?.name === 'NotAllowedError'
        ? 'Camera permission was declined. Practice works fine without it.'
        : (mediaError?.message ?? 'Could not start the camera.'))
    }
  }, [])

  return { videoRef, startCamera, stopCamera, status, error, samples, summary: summarise(samples) }
}

/** Turns raw samples into plain descriptive feedback — never a score of the person. */
function summarise(samples) {
  if (samples.length < MIN_SAMPLES) return null
  const present = samples.filter((sample) => sample.present)
  const inFrame = present.length / samples.length

  const notes = []
  notes.push(inFrame < 0.7
    ? 'Your face left the frame for part of the answer — reposition so your head and shoulders stay visible.'
    : 'You stayed in frame for most of the answer.')

  if (present.length >= 2) {
    const avgOffset = present.reduce((sum, s) => sum + s.centerOffset, 0) / present.length
    notes.push(avgOffset > 0.45
      ? 'You sat off to one side — centre yourself in the frame.'
      : 'You were well centred.')

    const avgCoverage = present.reduce((sum, s) => sum + s.coverage, 0) / present.length
    if (avgCoverage < 0.02) notes.push('You appear quite far from the camera — move closer so your face is clearly visible.')
    else if (avgCoverage > 0.35) notes.push('You are very close to the camera — pull back slightly.')

    // Standard deviation of centre position: a rough steadiness proxy.
    const mean = avgOffset
    const variance = present.reduce((sum, s) => sum + (s.centerOffset - mean) ** 2, 0) / present.length
    if (Math.sqrt(variance) > 0.18) notes.push('You moved around a fair amount — try to stay settled.')
  }

  return { inFramePercent: Math.round(inFrame * 100), sampleCount: samples.length, notes }
}

import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../auth.js'
import { BTN_PRIMARY, CARD, CONTROL, FOCUS } from '../components/ui/styles.js'
import { buildQuestionSet } from '../lib/interviewQuestions.js'
import { scoreBand, useAnswerScoring } from '../lib/useAnswerScoring.js'
import { useFramingCheck } from '../lib/useFramingCheck.js'

export default function AiInterview({ session }) {
  const [profile, setProfile] = useState(null)
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [scoring, setScoring] = useState(false)
  const [showReference, setShowReference] = useState(false)

  const { scoreAnswer, status: scoringStatus, error: scoringError } = useAnswerScoring()
  const {
    videoRef,
    startCamera,
    stopCamera,
    status: framingStatus,
    error: framingError,
    summary: framingSummary,
    samples: framingSamples,
  } = useFramingCheck()

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

  const questions = useMemo(
    () => (profile ? buildQuestionSet(profile, programs) : []),
    [profile, programs],
  )
  const question = questions[index]

  const submit = async (event) => {
    event.preventDefault()
    if (!question) return
    setScoring(true)
    setError('')
    try {
      setResult(await scoreAnswer(answer, question))
    } catch (scoreError) {
      setError(scoreError.message)
    } finally {
      setScoring(false)
    }
  }

  const goTo = (nextIndex) => {
    setIndex(nextIndex)
    setAnswer('')
    setResult(null)
    setShowReference(false)
  }

  const band = result ? scoreBand(result.score) : null
  const modelLoading = scoringStatus === 'loading-model'

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Practice</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-secondary-950">Mock interview</h1>
        <p className="mt-2 text-secondary-500">
          Questions built from your profile and the program catalogue. Everything runs in your
          browser — nothing you type or record is uploaded.
        </p>
      </header>

      {(error || scoringError) && (
        <div className="mb-6 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
          {error || scoringError}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className={`h-96 animate-pulse ${CARD}`} />
          <div className={`h-64 animate-pulse ${CARD}`} />
        </div>
      ) : !question ? (
        <div className={`px-6 py-12 text-center ${CARD}`}>
          <p className="font-semibold text-secondary-950">No questions available</p>
          <p className="mt-1 text-sm text-secondary-500">We couldn&rsquo;t load your profile or the program catalogue.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className={`p-6 ${CARD}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-bold text-accent-600">
                {question.category}
              </span>
              <p className="text-sm text-secondary-500">Question {index + 1} of {questions.length}</p>
            </div>

            <h2 className="mt-4 text-xl font-bold leading-snug text-secondary-950">{question.prompt}</h2>
            <p className="mt-2 text-sm text-secondary-500">{question.tip}</p>

            <form className="mt-5" onSubmit={submit}>
              <label className="mb-1.5 block text-sm font-medium text-secondary-700" htmlFor="answer">
                Your answer
              </label>
              <textarea
                className={`min-h-44 w-full ${CONTROL}`}
                id="answer"
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Answer as you would out loud, in full sentences."
                value={answer}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button className={BTN_PRIMARY} disabled={scoring || !answer.trim()} type="submit">
                  {modelLoading ? 'Loading scorer…' : scoring ? 'Scoring…' : 'Score my answer'}
                </button>
                <p className="text-sm text-secondary-500">
                  {answer.trim().split(/\s+/).filter(Boolean).length} words
                </p>
              </div>
              {modelLoading && (
                <p aria-live="polite" className="mt-2 text-sm text-secondary-600">
                  Downloading the scoring model — first time only, then it&rsquo;s cached.
                </p>
              )}
            </form>

            {result && (
              <div aria-live="polite" className="mt-6 border-t border-secondary-200 pt-5">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-3xl font-bold text-secondary-950">{result.score}<span className="text-base font-medium text-secondary-500">/100</span></p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${band.className}`}>{band.label}</span>
                  <p className="text-sm text-secondary-500">
                    {result.coverage}% of key points · {result.similarity}% similar to a model answer
                  </p>
                </div>

                {result.capped && (
                  <p className="mt-3 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700">
                    Your answer is short ({result.wordCount} words), so the score is capped. Interviewers
                    expect you to develop the point.
                  </p>
                )}

                {result.missed.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-secondary-950">You didn&rsquo;t cover</h3>
                    <ul className="mt-2 space-y-1.5">
                      {result.missed.map((point) => (
                        <li className="flex gap-2 text-sm text-secondary-600" key={point}>
                          <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger-500" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.covered.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-secondary-950">You covered</h3>
                    <ul className="mt-2 space-y-1.5">
                      {result.covered.map((point) => (
                        <li className="flex gap-2 text-sm text-secondary-600" key={point}>
                          <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success-500" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  aria-expanded={showReference}
                  className={`mt-4 rounded-lg text-sm font-semibold text-primary-600 ${FOCUS}`}
                  onClick={() => setShowReference((value) => !value)}
                  type="button"
                >
                  {showReference ? 'Hide' : 'Show'} a model answer
                </button>
                {showReference && (
                  <p className="mt-2 rounded-lg bg-secondary-50 p-4 text-sm leading-6 text-secondary-700">
                    {question.reference}
                  </p>
                )}

                <p className="mt-4 text-xs leading-5 text-secondary-400">
                  This score is a completeness check from a small language model, not an assessment.
                  It cannot tell whether what you said is true, and it handles negation poorly.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-between border-t border-secondary-200 pt-4">
              <button className={`rounded-lg px-3 py-2 text-sm font-semibold text-secondary-600 disabled:opacity-40 ${FOCUS}`}
                disabled={index === 0} onClick={() => goTo(index - 1)} type="button">
                ← Previous
              </button>
              <button className={`rounded-lg px-3 py-2 text-sm font-semibold text-primary-600 disabled:opacity-40 ${FOCUS}`}
                disabled={index >= questions.length - 1} onClick={() => goTo(index + 1)} type="button">
                Next question →
              </button>
            </div>
          </section>

          <aside className={`h-fit p-5 ${CARD}`}>
            <h2 className="text-base font-bold text-secondary-950">Camera check</h2>
            <p className="mt-1 text-sm leading-6 text-secondary-500">
              Optional. Checks only whether you stay in frame, centred and steady.
            </p>
            <p className="mt-2 rounded-lg bg-secondary-50 px-3 py-2 text-xs leading-5 text-secondary-600">
              It does not read your face for emotion, confidence or personality — that inference
              isn&rsquo;t scientifically reliable and is restricted in education settings. Video is
              analysed on your device and never uploaded or saved.
            </p>

            <div className="mt-4 overflow-hidden rounded-2xl bg-secondary-900">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption -- live self-view, no audio track */}
              <video className="aspect-video w-full object-cover" muted playsInline ref={videoRef} />
            </div>

            <div className="mt-3 flex gap-2">
              {framingStatus === 'off' ? (
                <button className={`w-full ${BTN_PRIMARY}`} onClick={startCamera} type="button">
                  Turn on camera
                </button>
              ) : (
                <button
                  className={`w-full rounded-lg border border-secondary-200 px-4 py-2.5 text-sm font-semibold text-secondary-700 ${FOCUS}`}
                  onClick={stopCamera}
                  type="button"
                >
                  Turn off camera
                </button>
              )}
            </div>

            <div aria-live="polite" className="mt-3">
              {framingStatus === 'loading-model' && (
                <p className="text-sm text-secondary-600">Loading the framing model — first time only.</p>
              )}
              {framingStatus === 'watching' && !framingSummary && (
                <p className="text-sm text-secondary-600">
                  Watching… {framingSamples.length} sample{framingSamples.length === 1 ? '' : 's'} so far.
                </p>
              )}
              {framingError && (
                <p className="text-sm text-warning-700" role="alert">{framingError}</p>
              )}
              {framingSummary && (
                <div>
                  <p className="text-sm font-semibold text-secondary-950">
                    In frame {framingSummary.inFramePercent}% of the time
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {framingSummary.notes.map((note) => (
                      <li className="flex gap-2 text-sm text-secondary-600" key={note}>
                        <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

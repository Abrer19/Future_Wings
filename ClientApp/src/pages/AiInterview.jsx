import { useEffect, useMemo, useRef, useState } from 'react'
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

  // Voice Interview Enhancements: Text-to-Speech & Speech-to-Text
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  // Question Practice Timer
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)

  const { scoreAnswer, status: scoringStatus, error: scoringError } = useAnswerScoring()
  const {
    videoRef,
    startCamera,
    stopCamera,
    status: framingStatus,
    detectorStatus,
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
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [session.token])

  // Timer interval
  useEffect(() => {
    let interval = null
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((sec) => sec + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerRunning])

  const questions = useMemo(
    () => (profile ? buildQuestionSet(profile, programs) : []),
    [profile, programs]
  )
  const question = questions[index]

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript
        }
        if (transcript) {
          setAnswer((prev) => {
            const trimmed = prev.trim()
            return trimmed ? `${trimmed} ${transcript}` : transcript
          })
        }
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // ignore
        }
      }
    }
  }, [])

  // Text-to-Speech: AI interviewer speaks question
  const speakQuestion = () => {
    if (!('speechSynthesis' in window) || !question) return

    if (isSpeakingQuestion) {
      window.speechSynthesis.cancel()
      setIsSpeakingQuestion(false)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(question.prompt)
    utterance.rate = 0.95
    utterance.pitch = 1.0
    utterance.lang = 'en-US'

    utterance.onstart = () => setIsSpeakingQuestion(true)
    utterance.onend = () => setIsSpeakingQuestion(false)
    utterance.onerror = () => setIsSpeakingQuestion(false)

    window.speechSynthesis.speak(utterance)
  }

  // Toggle voice dictation
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    if (isListening) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        if (!timerRunning) setTimerRunning(true)
      } catch {
        setIsListening(false)
      }
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!question) return
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      setIsListening(false)
    }
    setTimerRunning(false)
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
    if (isSpeakingQuestion && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeakingQuestion(false)
    }
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      setIsListening(false)
    }
    setIndex(nextIndex)
    setAnswer('')
    setResult(null)
    setShowReference(false)
    setTimerSeconds(0)
    setTimerRunning(false)
  }

  const band = result ? scoreBand(result.score) : null
  const modelLoading = scoringStatus === 'loading-model'

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60)
    const rem = sec % 60
    return `${mins < 10 ? '0' : ''}${mins}:${rem < 10 ? '0' : ''}${rem}`
  }

  return (
    <div className="mx-auto max-w-6xl pb-16">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl border border-secondary-200 bg-gradient-to-r from-secondary-950 via-secondary-900 to-secondary-950 p-6 sm:p-8 text-white shadow-xl mb-8">
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-primary-500/20 border border-primary-400/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-300">
                <span className="h-2 w-2 rounded-full bg-primary-400 animate-pulse" />
                AI Admissions & Visa Simulator
              </span>
              <span className="text-xs text-secondary-400 font-medium">On-Device MiniLM NLP Scorer</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              AI Mock Interview Practice
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-secondary-300 max-w-2xl">
              Personalized questions derived from your profile ({profile?.major || 'Academic'} degree, GPA {profile?.cgpa || '3.50'}, budget). Evaluated in your browser with zero data retention.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md px-4 py-2 border border-white/15 text-center">
              <span className="block text-[10px] font-bold uppercase text-secondary-300">Answer Timer</span>
              <span className="font-mono text-lg font-black text-primary-400">
                {formatTimer(timerSeconds)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {(error || scoringError) && (
        <div className="mb-6 rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700 shadow-sm flex items-start gap-2" role="alert">
          <svg className="w-5 h-5 shrink-0 mt-0.5 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <strong>Notice:</strong> {error || scoringError}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="h-96 animate-pulse rounded-2xl bg-white border border-secondary-200 shadow-sm" />
          <div className="h-64 animate-pulse rounded-2xl bg-white border border-secondary-200 shadow-sm" />
        </div>
      ) : !question ? (
        <div className="rounded-3xl border border-secondary-200 bg-white p-12 text-center shadow-sm">
          <p className="font-bold text-secondary-950 text-lg">No questions available</p>
          <p className="mt-1 text-sm text-secondary-500">
            Please complete your profile or check your internet connection to load the catalog.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Main Interview Card */}
          <section className="rounded-3xl border border-secondary-200 bg-white p-6 sm:p-8 shadow-sm">
            {/* Top Question Progress & Category */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-primary-50 border border-primary-200 px-2.5 py-1 text-xs font-extrabold uppercase text-primary-800">
                  {question.category}
                </span>
                <span className="text-xs font-semibold text-secondary-500">
                  Question {index + 1} of {questions.length}
                </span>
              </div>

              {/* Text to Speech button */}
              <button
                type="button"
                onClick={speakQuestion}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                  isSpeakingQuestion
                    ? 'bg-danger-600 text-white animate-pulse'
                    : 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
                }`}
                title="Listen to the interviewer read the question out loud"
              >
                {isSpeakingQuestion ? (
                  <>
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="1" />
                    </svg>
                    <span>Stop Audio</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    <span>Listen to Interviewer</span>
                  </>
                )}
              </button>
            </div>

            {/* Question Prompt */}
            <div className="mt-5">
              <h2 className="text-xl sm:text-2xl font-black leading-snug text-secondary-950">
                {question.prompt}
              </h2>
              <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-secondary-50 border border-secondary-200 p-3 text-xs text-secondary-800">
                <span className="font-bold text-primary-600">Tip:</span>
                <span>{question.tip}</span>
              </div>
            </div>

            {/* Answer Input Area */}
            <form className="mt-6" onSubmit={submit}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary-700" htmlFor="answer">
                  Your Response
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      isListening
                        ? 'bg-danger-600 text-white animate-pulse'
                        : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                    }`}
                    title="Dictate response via microphone"
                  >
                    {isListening ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                        <span>Recording Voice...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <span>Dictate Speech</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimerRunning((r) => !r)}
                    className="inline-flex items-center gap-1 rounded-lg bg-secondary-100 px-2.5 py-1 text-xs font-semibold text-secondary-700 hover:bg-secondary-200"
                  >
                    {timerRunning ? (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                        <span>Pause Timer</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                        <span>Start Timer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <textarea
                className="w-full min-h-48 rounded-2xl border border-secondary-300 p-4 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-inner leading-relaxed"
                id="answer"
                onChange={(event) => {
                  setAnswer(event.target.value)
                  if (!timerRunning && event.target.value.length > 0) {
                    setTimerRunning(true)
                  }
                }}
                placeholder="Type or speak your answer out loud in complete sentences as if speaking to the admissions officer..."
                value={answer}
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    className="rounded-2xl bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 text-sm font-extrabold shadow-lg hover:shadow-primary-500/25 transition disabled:opacity-50 inline-flex items-center gap-2"
                    disabled={scoring || !answer.trim()}
                    type="submit"
                  >
                    {modelLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Loading NLP Model…</span>
                      </>
                    ) : scoring ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Evaluating Response…</span>
                      </>
                    ) : (
                      <span>Score My Answer</span>
                    )}
                  </button>

                  <span className="text-xs text-secondary-500 font-semibold">
                    {answer.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>

                {answer && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnswer('')
                      setResult(null)
                    }}
                    className="text-xs font-bold text-secondary-500 hover:text-secondary-800"
                  >
                    Clear Input
                  </button>
                )}
              </div>

              {modelLoading && (
                <p aria-live="polite" className="mt-3 rounded-xl bg-primary-50 border border-primary-200 p-3 text-xs text-primary-900">
                  Downloading all-MiniLM-L6-v2 transformer model into browser cache — first run only (23MB).
                </p>
              )}
            </form>

            {/* Result Analysis Card */}
            {result && (
              <div aria-live="polite" className="mt-8 rounded-2xl border border-secondary-200 bg-secondary-50/50 p-6 shadow-inner animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-secondary-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-2xl font-black text-white shadow">
                      {result.score}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-extrabold text-secondary-950">
                          {result.score} / 100
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-black uppercase ${band?.className || 'bg-primary-100 text-primary-800'}`}>
                          {band?.label || 'Evaluated'}
                        </span>
                      </div>
                      <p className="text-xs text-secondary-500 mt-0.5">
                        {result.coverage}% Key Point Rubric Coverage • {result.similarity}% Semantic Topic Similarity
                      </p>
                    </div>
                  </div>
                </div>

                {result.capped && (
                  <div className="mt-4 rounded-xl bg-warning-50 border border-warning-200 p-3 text-xs text-warning-800 flex items-start gap-2">
                    <svg className="w-4 h-4 shrink-0 text-warning-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <strong>Short Answer Cap:</strong> Your answer is {result.wordCount} words. Visa and university interviewers expect at least 25-50 words to substantiate reasons.
                    </div>
                  </div>
                )}

                {/* Covered Points */}
                {result.covered && result.covered.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-success-700 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Successfully Addressed Key Points ({result.covered.length})</span>
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {result.covered.map((point) => (
                        <li className="flex items-start gap-2 text-xs text-secondary-700 bg-success-50/60 border border-success-200/60 rounded-xl p-2.5" key={point}>
                          <span className="text-success-600 font-bold mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missed Points */}
                {result.missed && result.missed.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-danger-700 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Recommended Points to Include ({result.missed.length})</span>
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {result.missed.map((point) => (
                        <li className="flex items-start gap-2 text-xs text-secondary-700 bg-danger-50/50 border border-danger-200/60 rounded-xl p-2.5" key={point}>
                          <span className="text-danger-500 font-bold mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reference Model Answer */}
                <div className="mt-5 pt-4 border-t border-secondary-200">
                  <button
                    aria-expanded={showReference}
                    className="rounded-xl border border-secondary-300 bg-white px-3.5 py-1.5 text-xs font-bold text-secondary-800 hover:bg-secondary-50 transition shadow-sm"
                    onClick={() => setShowReference((value) => !value)}
                    type="button"
                  >
                    {showReference ? 'Hide Benchmark Answer' : 'View Benchmark Answer'}
                  </button>

                  {showReference && (
                    <div className="mt-3 rounded-2xl bg-white border border-primary-200 p-4 text-xs leading-relaxed text-secondary-800 shadow-sm">
                      <p className="font-bold text-primary-800 mb-1">Benchmark Model Answer:</p>
                      <p className="font-sans text-secondary-700">{question.reference}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="mt-8 flex items-center justify-between border-t border-secondary-100 pt-4">
              <button
                className="rounded-xl border border-secondary-300 bg-white px-4 py-2 text-xs font-bold text-secondary-700 hover:bg-secondary-50 disabled:opacity-40 transition shadow-sm"
                disabled={index === 0}
                onClick={() => goTo(index - 1)}
                type="button"
              >
                Previous Question
              </button>
              <span className="text-xs font-bold text-secondary-500">
                {index + 1} of {questions.length}
              </span>
              <button
                className="rounded-xl bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 text-xs font-bold disabled:opacity-40 transition shadow-sm"
                disabled={index >= questions.length - 1}
                onClick={() => goTo(index + 1)}
                type="button"
              >
                Next Question
              </button>
            </div>
          </section>

          {/* Sidebar / Camera Check */}
          <aside className="h-fit space-y-6">
            <div className="rounded-3xl border border-secondary-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-secondary-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-900">
                    Video Framing Check
                  </h3>
                  {framingStatus !== 'off' && framingStatus !== 'error' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-success-700 bg-success-50 border border-success-200 px-2 py-0.5 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse" />
                      Live Feed
                    </span>
                  )}
                </div>
                <span className="rounded-md bg-secondary-100 px-2 py-0.5 text-[10px] font-bold text-secondary-600">
                  Optional
                </span>
              </div>
              <p className="text-xs text-secondary-500 leading-relaxed">
                Checks whether your face is centered and steady during response delivery using on-device vision.
              </p>

              <div className="mt-4 overflow-hidden rounded-2xl bg-secondary-950 aspect-video relative flex items-center justify-center border border-secondary-800 shadow-inner">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  autoPlay
                  className="aspect-video w-full object-cover"
                  muted
                  playsInline
                  ref={videoRef}
                />
                {framingStatus === 'off' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-secondary-400 text-xs gap-2 bg-secondary-950/90">
                    <svg className="w-8 h-8 text-secondary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="font-semibold text-secondary-300">Camera is Turned Off</span>
                    <span className="text-[11px] text-secondary-500">Click below to practice with webcam</span>
                  </div>
                )}
                {framingStatus === 'starting' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-primary-300 text-xs gap-2 bg-secondary-950/90">
                    <svg className="w-6 h-6 animate-spin text-primary-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="font-semibold">Accessing Webcam…</span>
                  </div>
                )}
              </div>

              <div className="mt-4">
                {framingStatus === 'off' || framingStatus === 'error' ? (
                  <button
                    className="w-full rounded-2xl bg-primary-500 hover:bg-primary-600 text-white py-2.5 text-xs font-extrabold transition shadow hover:shadow-primary-500/20"
                    onClick={startCamera}
                    type="button"
                  >
                    {framingStatus === 'error' ? 'Retry Camera' : 'Turn On Video Check'}
                  </button>
                ) : (
                  <button
                    className="w-full rounded-2xl border border-secondary-300 bg-white hover:bg-secondary-50 py-2.5 text-xs font-bold text-secondary-700 transition shadow-sm"
                    onClick={stopCamera}
                    type="button"
                  >
                    Turn Off Camera
                  </button>
                )}
              </div>

              <div aria-live="polite" className="mt-3 text-xs space-y-2">
                {detectorStatus === 'loading' && (
                  <p className="text-primary-700 font-semibold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                    Loading MediaPipe detector in background…
                  </p>
                )}
                {detectorStatus === 'ready' && framingStatus === 'watching' && !framingSummary && (
                  <p className="text-secondary-600 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary-500" />
                    Analyzing framing… ({framingSamples.length} samples)
                  </p>
                )}
                {detectorStatus === 'offline' && (
                  <p className="text-secondary-600 text-[11px] bg-secondary-50 border border-secondary-200 rounded-lg p-2">
                    Camera stream is live. Face detector is offline (framing tips paused).
                  </p>
                )}
                {framingError && (
                  <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-danger-800 space-y-1.5" role="alert">
                    <div className="flex items-center gap-1.5 font-bold text-danger-900">
                      <svg className="w-4 h-4 text-danger-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Camera Unavailable</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-danger-700">{framingError}</p>
                    <div className="text-[10px] text-danger-600 border-t border-danger-200 pt-1.5 mt-1 leading-normal">
                      <strong>Troubleshooting steps:</strong>
                      <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                        <li>Click the permission icon on the left of your browser address bar to allow camera access.</li>
                        <li>Close any other application using the webcam (Zoom, Teams, etc.).</li>
                        <li>Ensure you are opening on <code>http://localhost:5173</code>.</li>
                      </ul>
                    </div>
                  </div>
                )}
                {framingSummary && (
                  <div className="rounded-xl bg-primary-50 border border-primary-200 p-3 mt-2">
                    <p className="font-bold text-primary-900">
                      In-Frame Score: {framingSummary.inFramePercent}%
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {framingSummary.notes.map((note) => (
                        <li className="flex items-start gap-1.5 text-secondary-700 text-[11px]" key={note}>
                          <span className="text-primary-600 font-bold">•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Preparation Strategy Card */}
            <div className="rounded-3xl border border-secondary-200 bg-secondary-50/70 p-6 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-secondary-900 mb-2">
                Admissions Rubric Guidelines
              </h3>
              <ul className="space-y-2 text-xs text-secondary-700">
                <li className="flex gap-2">
                  <span className="text-primary-600 font-bold">1.</span>
                  <span><strong>Be Specific:</strong> Reference modules, faculty, and career outcomes rather than generic prestige.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary-600 font-bold">2.</span>
                  <span><strong>Evidence Finances:</strong> Clarify funds, bank statements, and separate living costs.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary-600 font-bold">3.</span>
                  <span><strong>Consistency:</strong> Ensure post-study goals match your selected study track.</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

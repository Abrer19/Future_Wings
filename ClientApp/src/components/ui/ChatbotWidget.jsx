import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '../../auth.js'

const initialMessages = [
  {
    role: 'assistant',
    text: 'Hi, I can help with study plans, destinations, documents, scholarships, and visa preparation.',
  },
]

export default function ChatbotWidget({ session, onSignIn }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    if (!open) return
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  const sendMessage = async (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text || sending) return

    setDraft('')
    setMessages((current) => [...current, { role: 'user', text }])

    if (!session?.token) {
      setMessages((current) => [
        ...current,
        { role: 'assistant', text: 'Please sign in first so I can answer with your FutureWings context.' },
      ])
      return
    }

    setSending(true)
    try {
      const response = await apiRequest('/ai/chat', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ message: text }),
      })
      setMessages((current) => [...current, { role: 'assistant', text: response.reply }])
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', text: error.message }])
    } finally {
      setSending(false)
    }
  }

  const launcherButton = (
    <button
      aria-label={open ? 'Close chat assistant' : 'Open chat assistant'}
      className={`group relative flex items-center justify-center overflow-visible bg-transparent drop-shadow-[0_18px_22px_rgba(15,23,42,0.28)] transition hover:-translate-y-1 hover:drop-shadow-[0_24px_26px_rgba(15,23,42,0.34)] focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/40 ${
        open ? 'h-20 w-20 sm:h-24 sm:w-24' : 'h-24 w-24 sm:h-28 sm:w-28'
      }`}
      onClick={() => setOpen((current) => !current)}
      type="button"
    >
      <img
        alt="Open FutureWings chat assistant"
        className="relative z-10 h-full w-full object-contain transition group-hover:scale-105"
        src="/chatbot-character.webp"
      />
    </button>
  )

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end sm:bottom-6 sm:right-6">
      {open && (
        <>
          <div className="mb-3">{launcherButton}</div>
          <section
            aria-label="FutureWings chat assistant"
            className="flex h-[min(430px,calc(100vh-10rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-[0_20px_60px_-24px_rgba(15,23,42,0.45)] sm:h-[min(480px,calc(100vh-11rem))]"
          >
            <header className="flex items-center justify-between gap-3 border-b border-secondary-100 bg-secondary-950 px-4 py-3 text-white">
              <div className="flex min-w-0 items-center gap-3">
                <img alt="" className="h-10 w-10 rounded-full bg-white object-contain p-1" src="/chatbot-character.webp" />
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold">Mr SpongeBob</h2>
                  <p className="truncate text-xs text-secondary-200">AI study-abroad helper</p>
                </div>
              </div>
              <button
                aria-label="Close chat"
                className="rounded-lg px-2 py-1 text-lg leading-none text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                onClick={() => setOpen(false)}
                type="button"
              >
                x
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-secondary-50 p-4" ref={listRef}>
              {messages.map((message, index) => (
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`} key={`${message.role}-${index}`}>
                  <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'border border-secondary-200 bg-white text-secondary-700'
                  }`}>
                    {message.text}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-500">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {!session?.token && (
              <div className="border-t border-secondary-100 bg-primary-50 px-4 py-3 text-sm text-primary-800">
                Sign in to chat with the AI assistant.
                {onSignIn && (
                  <button className="ml-2 font-bold underline" onClick={onSignIn} type="button">
                    Sign in
                  </button>
                )}
              </div>
            )}

            <form className="flex gap-2 border-t border-secondary-100 bg-white p-3" onSubmit={sendMessage}>
              <label className="sr-only" htmlFor="chatbot-message">Message</label>
              <input
                className="min-w-0 flex-1 rounded-lg border border-secondary-200 px-3 py-2 text-sm text-secondary-950 outline-none transition placeholder:text-secondary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                disabled={sending}
                id="chatbot-message"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about your next step..."
                value={draft}
              />
              <button
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={sending || !draft.trim()}
                type="submit"
              >
                Send
              </button>
            </form>
          </section>
        </>
      )}

      {!open && (
        <div className="group relative h-44 w-[min(22rem,calc(100vw-2rem))]">
          <div className="absolute left-5 -top-4 w-52 rounded-[1.25rem] border-2 border-secondary-400 bg-white px-4 py-3 text-center text-sm font-black leading-5 text-secondary-950 shadow-[0_16px_36px_-24px_rgba(15,23,42,0.7)] transition group-hover:-translate-y-1 group-hover:shadow-[0_22px_44px_-24px_rgba(15,23,42,0.78)] sm:left-7 sm:-top-5 sm:w-60 sm:text-base sm:leading-6">
            <span className="relative z-10">Ask Mr SpongeBob for any question</span>
            <span className="absolute -bottom-3 right-8 h-6 w-6 rotate-45 border-r-2 border-b-2 border-secondary-400 bg-white" />
          </div>
          <div className="absolute bottom-0 right-0">
            {launcherButton}
          </div>
        </div>
      )}
    </div>
  )
}

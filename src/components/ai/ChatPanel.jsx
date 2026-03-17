import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2, Bot, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function ChatPanel({ open, onClose }) {
  const { session } = useAuth()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! I'm your AI business analyst. I can analyze your CRM data and give you actionable recommendations. Try asking me things like:\n\n- \"What's my current MRR breakdown?\"\n- \"Which deals should I prioritize?\"\n- \"Do I have any overdue tasks?\"\n- \"How can I grow my revenue?\"",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      // Build history (exclude the welcome message and the current user message)
      const history = messages
        .filter((_, i) => i > 0) // skip welcome message
        .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', content: m.content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: text, history }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Sorry, I encountered an error: ${err.message}. Please try again.` },
      ])
    }
    setLoading(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-end p-4 md:inset-x-auto md:right-6 md:bottom-24">
      <div className="flex h-[500px] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-brand-charcoal shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-brand-black px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-brand-green/20 p-1.5">
              <Bot className="h-4 w-4 text-brand-lime" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-brand-cream">AI Analyst</h3>
              <p className="text-[10px] text-brand-cream/40">Powered by Gemini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-brand-cream/40 transition-colors hover:bg-white/10 hover:text-brand-cream"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="mt-1 shrink-0 rounded-full bg-brand-green/20 p-1">
                    <Bot className="h-3 w-3 text-brand-lime" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-green text-brand-cream'
                      : 'bg-brand-black text-brand-cream/80'
                  }`}
                >
                  <MessageContent content={msg.content} />
                </div>
                {msg.role === 'user' && (
                  <div className="mt-1 shrink-0 rounded-full bg-white/10 p-1">
                    <User className="h-3 w-3 text-brand-cream/60" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="mt-1 shrink-0 rounded-full bg-brand-green/20 p-1">
                  <Bot className="h-3 w-3 text-brand-lime" />
                </div>
                <div className="rounded-2xl bg-brand-black px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand-cream/30" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand-cream/30" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand-cream/30" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="border-t border-white/10 p-3">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your business..."
              disabled={loading}
              className="flex-1 rounded-xl border border-white/10 bg-brand-black px-4 py-2.5 text-sm text-brand-cream placeholder-brand-cream/30 outline-none focus:border-brand-green disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="cursor-pointer rounded-xl bg-brand-green px-3 py-2.5 text-brand-cream transition-colors hover:bg-brand-green/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MessageContent({ content }) {
  // Simple markdown rendering: bold, line breaks, lists
  const lines = content.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />

        // Headings
        if (line.startsWith('### ')) return <p key={i} className="font-semibold text-brand-cream">{line.slice(4)}</p>
        if (line.startsWith('## ')) return <p key={i} className="font-semibold text-brand-cream">{line.slice(3)}</p>

        // Bullet points
        if (line.match(/^[-•*]\s/)) {
          return (
            <p key={i} className="ml-2">
              <span className="text-brand-lime">•</span>{' '}
              <InlineMarkdown text={line.replace(/^[-•*]\s/, '')} />
            </p>
          )
        }

        // Numbered list
        if (line.match(/^\d+\.\s/)) {
          const num = line.match(/^(\d+)\./)[1]
          return (
            <p key={i} className="ml-2">
              <span className="text-brand-lime">{num}.</span>{' '}
              <InlineMarkdown text={line.replace(/^\d+\.\s/, '')} />
            </p>
          )
        }

        return <p key={i}><InlineMarkdown text={line} /></p>
      })}
    </div>
  )
}

function InlineMarkdown({ text }) {
  // Handle **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-brand-cream">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="rounded bg-white/10 px-1 py-0.5 text-xs text-brand-lime">{part.slice(1, -1)}</code>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

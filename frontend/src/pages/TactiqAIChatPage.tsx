import { useCallback, useEffect, useRef, useState } from 'react'
import { sendAgentMessage } from '../api/teamAnalytics'
import type { AgentToolStep } from '../types/domain'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  steps?: AgentToolStep[]
  isError?: boolean
}

const SUGGESTED_PROMPTS = [
  'Who should replace the injured striker?',
  'How ready is the squad for the next match?',
  'What are the tactical weaknesses of our next opponent?',
  'Show me the depth chart for center back.',
  'Give me a full injury report.',
  'Analyze overall squad fitness.',
]

function ToolStepsAccordion({ steps }: { steps: AgentToolStep[] }) {
  const [open, setOpen] = useState(false)
  if (!steps.length) return null

  return (
    <div className="chat-steps-wrap">
      <button
        type="button"
        className="chat-steps-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="chat-steps-icon">{open ? '▾' : '▸'}</span>
        {steps.length} data tool{steps.length > 1 ? 's' : ''} used
      </button>
      {open && (
        <ul className="chat-steps-list">
          {steps.map((step, i) => (
            <li key={i} className="chat-step-item">
              <span className="chat-step-tool">{step.tool}</span>
              {step.output_preview && (
                <span className="chat-step-preview">{step.output_preview}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`chat-bubble-row ${isUser ? 'chat-bubble-row--user' : 'chat-bubble-row--ai'}`}>
      <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : message.isError ? 'chat-bubble--error' : 'chat-bubble--ai'}`}>
        {!isUser && (
          <p className="chat-bubble-label">TactiqAI</p>
        )}
        <p className="chat-bubble-text">{message.content}</p>
        {message.steps && <ToolStepsAccordion steps={message.steps} />}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="chat-bubble-row chat-bubble-row--ai">
      <div className="chat-bubble chat-bubble--ai">
        <p className="chat-bubble-label">TactiqAI</p>
        <div className="chat-typing">
          <span /><span /><span />
        </div>
      </div>
    </div>
  )
}

let msgCounter = 0
function nextId() {
  return String(++msgCounter)
}

export default function TactiqAIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: nextId(),
      role: 'assistant',
      content:
        "Hello, I'm TactiqAI — your coaching intelligence for Jordan 2026. Ask me about squad fitness, injuries, replacements, tactical matchups, or match readiness. What would you like to know?",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Build history for multi-turn context (last 10 turns)
  const buildHistory = useCallback(
    (current: Message[]) =>
      current
        .filter((m) => !m.isError)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content })),
    [],
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      const userMsg: Message = { id: nextId(), role: 'user', content: trimmed }
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setIsLoading(true)

      try {
        const history = buildHistory([...messages, userMsg])
        const result = await sendAgentMessage({ query: trimmed, history })
        const aiMsg: Message = {
          id: nextId(),
          role: 'assistant',
          content: result.answer || 'I was unable to generate a response. Please try again.',
          steps: result.tool_steps ?? [],
        }
        setMessages((prev) => [...prev, aiMsg])
      } catch (err) {
        const errorMsg: Message = {
          id: nextId(),
          role: 'assistant',
          content:
            err instanceof Error
              ? `Error: ${err.message}`
              : 'Something went wrong. Please try again.',
          isError: true,
        }
        setMessages((prev) => [...prev, errorMsg])
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, messages, buildHistory],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        void sendMessage(input)
      }
    },
    [input, sendMessage],
  )

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="page-stack">
      {/* Header */}
      <section className="hero-banner card-surface">
        <p className="section-eyebrow">Coaching Intelligence</p>
        <h2>TactiqAI Assistant</h2>
        <p className="section-copy">
          Ask about squad fitness, injury replacements, tactical matchups, or match readiness.
          TactiqAI queries live squad data to back every answer.
        </p>
      </section>

      {/* Main chat layout */}
      <div className="chat-layout">
        {/* Sidebar: suggested prompts */}
        <aside className="chat-sidebar card-surface">
          <p className="section-eyebrow">Suggested Questions</p>
          <ul className="chat-suggestions">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <li key={prompt}>
                <button
                  type="button"
                  className="chat-suggestion-btn"
                  onClick={() => void sendMessage(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Chat panel */}
        <div className="chat-panel card-surface">
          {/* Message list */}
          <div className="chat-messages" role="log" aria-live="polite">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="chat-input-area">
            <textarea
              ref={inputRef}
              className="chat-input"
              rows={2}
              placeholder="Ask TactiqAI anything about the squad…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              aria-label="Message TactiqAI"
            />
            <button
              type="button"
              className="chat-send-btn primary-action"
              onClick={() => void sendMessage(input)}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              {isLoading ? '…' : 'Send'}
            </button>
          </div>
          <p className="chat-hint muted">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}

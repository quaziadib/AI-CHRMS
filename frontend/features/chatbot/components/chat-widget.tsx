'use client'

import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import { MessageCircle, X, Send, Bot, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChat } from '../hooks/use-chat'

const WELCOME = "Hi! I'm your diabetes health assistant. Ask me anything about diabetes, your risk factors, diet, or lifestyle — I'm here to help."

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const { messages, isLoading, isLoadingHistory, sendMessage, clearHistory } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const showWelcome = !isLoadingHistory && messages.length === 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, isLoadingHistory])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all chat history? This cannot be undone.')) return
    await clearHistory()
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading || isLoadingHistory) return
    setInput('')
    await sendMessage(trimmed)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col w-[360px] h-[480px] rounded-2xl border bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground shrink-0">
            <Bot className="h-5 w-5" />
            <span className="font-semibold text-sm">Health Assistant</span>
            <button
              className="rounded-full p-1 hover:bg-white/20 transition-colors"
              onClick={handleClearHistory}
              disabled={isLoadingHistory || messages.length === 0}
              aria-label="Clear chat history"
              title="Clear history"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              className="ml-auto rounded-full p-1 hover:bg-white/20 transition-colors"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoadingHistory ? (
              <HistorySkeleton />
            ) : (
              <>
                {showWelcome && <AssistantBubble content={WELCOME} />}
                {messages.map(msg =>
                  msg.role === 'user' ? (
                    <UserBubble key={msg.id} content={msg.content} />
                  ) : (
                    <AssistantBubble key={msg.id} content={msg.content} />
                  )
                )}
                {isLoading && <LoadingBubble />}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t bg-card p-3 flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about diabetes, diet, lifestyle..."
              rows={1}
              maxLength={500}
              disabled={isLoadingHistory}
              className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[38px] max-h-[100px] disabled:opacity-50"
              style={{ overflowY: input.split('\n').length > 2 ? 'auto' : 'hidden' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isLoadingHistory}
              className={cn(
                "flex items-center justify-center h-[38px] w-[38px] rounded-lg transition-colors shrink-0",
                input.trim() && !isLoading && !isLoadingHistory
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex items-center justify-center h-14 w-14 rounded-full shadow-lg transition-all duration-200",
          open
            ? "bg-muted text-muted-foreground"
            : "bg-primary text-primary-foreground hover:scale-105"
        )}
        aria-label={open ? 'Close health assistant' : 'Open health assistant'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex justify-start">
        <div className="h-12 w-3/4 rounded-2xl bg-muted" />
      </div>
      <div className="flex justify-end">
        <div className="h-10 w-1/2 rounded-2xl bg-muted" />
      </div>
      <div className="flex justify-start">
        <div className="h-14 w-4/5 rounded-2xl bg-muted" />
      </div>
    </div>
  )
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-3 py-2 text-sm leading-relaxed">
        {content}
      </div>
    </div>
  )
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  )
}

function LoadingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

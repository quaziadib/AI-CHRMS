'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, AlertTriangle, WifiOff } from 'lucide-react'
import { chatApi, type ChatMessage } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

// Lightweight markdown → JSX renderer for AI responses
function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key} className="list-disc list-inside space-y-0.5 my-1">
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  const renderInline = (text: string): React.ReactNode => {
    // Split on **bold**, *italic*, `code`
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i}>{part.slice(2, -2)}</strong>
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={i}>{part.slice(1, -1)}</em>
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={i} className="bg-black/10 dark:bg-white/10 rounded px-1 font-mono text-xs">{part.slice(1, -1)}</code>
      return part
    })
  }

  lines.forEach((line, i) => {
    const isList = /^[-*•]\s+/.test(line)
    const isHeader = /^#{1,3}\s+/.test(line)
    const isEmpty = line.trim() === ''

    if (isList) {
      listItems.push(line.replace(/^[-*•]\s+/, ''))
      return
    }

    flushList(`list-${i}`)

    if (isEmpty) {
      // skip double blank lines but add spacing via margin on paragraphs
      return
    }

    if (isHeader) {
      const text = line.replace(/^#{1,3}\s+/, '')
      elements.push(
        <p key={i} className="font-semibold mt-2 mb-0.5">{renderInline(text)}</p>
      )
      return
    }

    elements.push(
      <p key={i} className="leading-relaxed">{renderInline(line)}</p>
    )
  })

  // Flush any trailing list
  flushList('list-end')

  return <div className="space-y-1 text-sm">{elements}</div>
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [disclaimer, setDisclaimer] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const send = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setIsLoading(true)

    const { data, error } = await chatApi.send(text)
    if (data) {
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      setDisclaimer(data.disclaimer)
    } else {
      if (error?.includes('not configured') || error?.includes('503')) {
        setUnavailable(true)
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: (error?.includes('not configured') || error?.includes('503'))
          ? 'The AI chatbot is not available on this server. Please contact your administrator to configure an OpenAI API key.'
          : (error || 'Sorry, something went wrong. Please try again.'),
      }])
    }
    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">AI Health Chat</h1>
        <p className="text-muted-foreground text-sm">Ask general health questions. Not a substitute for medical advice.</p>
      </div>

      {/* Unavailable banner */}
      {unavailable && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4">
          <WifiOff className="h-4 w-4 shrink-0 mt-0.5" />
          <span>AI chatbot is not configured. Add <code className="font-mono">OPENAI_API_KEY</code> to the server environment and restart.</span>
        </div>
      )}

      {/* Disclaimer banner */}
      {!unavailable && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200 mb-4">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>For educational purposes only. Always consult a qualified healthcare professional for personal medical advice.</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <Bot className="h-12 w-12 opacity-30" />
            <p className="text-sm">Ask a health-related question to get started.</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn('flex gap-3 items-end', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            {m.role === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground self-start mt-1">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div className={cn(
              'max-w-[78%] rounded-2xl px-4 py-3',
              m.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm text-sm'
                : 'bg-muted rounded-bl-sm',
            )}>
              {m.role === 'assistant'
                ? <MarkdownMessage content={m.content} />
                : m.content
              }
            </div>

            {m.role === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary self-start mt-1">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start items-end">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t mt-4">
        {disclaimer && messages.length > 0 && (
          <p className="text-xs text-muted-foreground mb-2 italic">{disclaimer}</p>
        )}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a health question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={send} disabled={isLoading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

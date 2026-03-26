'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, AlertTriangle, WifiOff } from 'lucide-react'
import { chatApi, type ChatMessage } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

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
          <div key={i} className={cn('flex gap-3', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            {m.role === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div className={cn(
              'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
              m.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted rounded-bl-sm',
            )}>
              {m.content}
            </div>
            {m.role === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
              <Spinner size="sm" />
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

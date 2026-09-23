'use client'

import { useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api/client'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface HistoryMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

/** Load chat history only when the widget is opened — avoids serial /history on every page. */
export function useChat({ enabled = true }: { enabled?: boolean } = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [historyFailed, setHistoryFailed] = useState(false)
  // Derive loading so the first open paint shows the skeleton (not the welcome bubble)
  // before the effect runs. Clear failure on reopen so the next open can retry.
  const isLoadingHistory = Boolean(enabled && !historyLoaded && !historyFailed)

  useEffect(() => {
    if (!enabled) {
      // Reset so the next open shows the skeleton immediately and retries on failure
      setHistoryFailed(false)
      return
    }
    if (historyLoaded) return

    let cancelled = false

    async function loadHistory() {
      const result = await api.get<{ messages: HistoryMessage[] }>('/chat/history')
      if (cancelled) return

      if (result.error || result.data === undefined) {
        // Leave historyLoaded false so the next open retries
        setHistoryFailed(true)
        return
      }

      if (result.data.messages) {
        setMessages(
          result.data.messages.map(m => ({
            id: String(m.id),
            role: m.role,
            content: m.content,
          }))
        )
      }
      setHistoryLoaded(true)
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [enabled, historyLoaded])

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content,
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    const result = await api.post<{ reply: string }>('/chat', { message: content })

    const assistantMsg: ChatMessage = {
      id: `${Date.now()}-assistant`,
      role: 'assistant',
      content: result.data?.reply ?? result.error ?? 'Something went wrong. Please try again.',
    }
    setMessages(prev => [...prev, assistantMsg])
    setIsLoading(false)
  }, [])

  const clearHistory = useCallback(async () => {
    const result = await api.delete<{ deleted: number }>('/chat/history')
    if (result.data !== undefined && !result.error) {
      setMessages([])
    }
  }, [])

  return { messages, isLoading, isLoadingHistory, sendMessage, clearHistory }
}

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

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      setIsLoadingHistory(true)
      const result = await api.get<{ messages: HistoryMessage[] }>('/chat/history')
      if (cancelled) return

      if (result.data?.messages) {
        setMessages(
          result.data.messages.map(m => ({
            id: String(m.id),
            role: m.role,
            content: m.content,
          }))
        )
      }
      setIsLoadingHistory(false)
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [])

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

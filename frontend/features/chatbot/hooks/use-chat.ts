'use client'

import { useState, useCallback } from 'react'
import { api } from '@/lib/api/client'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

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

  const clearMessages = useCallback(() => setMessages([]), [])

  return { messages, isLoading, sendMessage, clearMessages }
}

'use client'

import { useEffect, useCallback, useRef } from 'react'

const DRAFT_KEY = 'health_form_draft'
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

export interface HealthFormDraft {
  currentStep: number
  data: Record<string, unknown>
  lastSaved: string
}

export function useFormDraft() {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadDraft = useCallback((): HealthFormDraft | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading draft:', error)
    }
    return null
  }, [])

  const saveDraft = useCallback((step: number, data: Record<string, unknown>) => {
    if (typeof window === 'undefined') return
    
    try {
      const draft: HealthFormDraft = {
        currentStep: step,
        data,
        lastSaved: new Date().toISOString(),
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch (error) {
      console.error('Error saving draft:', error)
    }
  }, [])

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(DRAFT_KEY)
  }, [])

  const scheduleSave = useCallback((step: number, data: Record<string, unknown>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft(step, data)
    }, AUTO_SAVE_INTERVAL)
  }, [saveDraft])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    loadDraft,
    saveDraft,
    clearDraft,
    scheduleSave,
  }
}

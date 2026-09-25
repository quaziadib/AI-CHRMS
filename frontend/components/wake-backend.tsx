'use client'

import { useEffect } from 'react'

/**
 * Kick the Render Free API awake as soon as the UI loads so login/API
 * calls are less likely to hit a sleeping backend.
 */
export function WakeBackend() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SKIP_BACKEND_WAKE === 'true') return

    const controller = new AbortController()
    void fetch('/backend-health', {
      cache: 'no-store',
      signal: controller.signal,
    }).catch(() => {
      /* ignore — API client retries handle residual cold starts */
    })

    return () => controller.abort()
  }, [])

  return null
}

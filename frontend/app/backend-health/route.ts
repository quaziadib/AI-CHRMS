import { getBackendUrl } from '@/lib/backend-url'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ATTEMPTS = 4
const ATTEMPT_TIMEOUT_MS = 45_000

/**
 * Wake the Render Free backend (it sleeps independently of the frontend).
 * Called from the browser on page load so both services come up together.
 */
export async function GET() {
  const url = `${getBackendUrl()}/health`

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      })
      if (res.ok) {
        const body = await res.json().catch(() => ({ status: 'ok' }))
        return Response.json(body)
      }
    } catch {
      // Cold start / network blip — retry
    }
    if (attempt < ATTEMPTS) {
      await new Promise((r) => setTimeout(r, 1500 * attempt))
    }
  }

  return Response.json(
    { status: 'waking', detail: 'Backend is still starting; retry shortly.' },
    { status: 503 },
  )
}

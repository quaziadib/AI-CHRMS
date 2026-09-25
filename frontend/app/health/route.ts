/**
 * Render health check: only report healthy once the in-container API is up.
 * Otherwise the free-tier service opens $PORT via Next while uvicorn is still
 * importing, and browsers get ECONNREFUSED on every /v1 proxy.
 */
export async function GET() {
  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
  try {
    const response = await fetch(`${backendUrl}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    })
    if (!response.ok) {
      return Response.json(
        { status: 'starting', service: 'ai-chrms', api: 'unhealthy' },
        { status: 503 },
      )
    }
    return Response.json({ status: 'ok', service: 'ai-chrms', api: 'up' })
  } catch {
    return Response.json(
      { status: 'starting', service: 'ai-chrms', api: 'down' },
      { status: 503 },
    )
  }
}

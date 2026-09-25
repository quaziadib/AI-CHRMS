/** Resolve the FastAPI base URL for server-side proxy / wake calls. */
export function getBackendUrl(): string {
  const host = process.env.BACKEND_URL || 'backend:8000'
  const trimmed = host.replace(/\/$/, '')
  return /^https?:\/\//.test(trimmed) ? trimmed : `http://${trimmed}`
}

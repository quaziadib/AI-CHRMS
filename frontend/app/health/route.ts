/**
 * Liveness for Render. Must not depend on the in-container API being ready yet,
 * or deploys fail while uvicorn is still importing.
 */
export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'ai-chrms',
  })
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.VERCEL === '1' ? {} : { output: 'standalone' }),
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    if (process.env.VERCEL === '1') return []
    const backendHost = process.env.BACKEND_URL || 'backend:8000'
    const backendUrl = /^https?:\/\//.test(backendHost)
      ? backendHost.replace(/\/$/, '')
      : `http://${backendHost.replace(/\/$/, '')}`
    return [
      {
        source: '/v1/:path*',
        destination: `${backendUrl}/v1/:path*`,
      },
      // FastAPI Swagger / ReDoc (Render combined container; API is loopback-only)
      {
        source: '/docs',
        destination: `${backendUrl}/docs`,
      },
      {
        source: '/docs/:path*',
        destination: `${backendUrl}/docs/:path*`,
      },
      {
        source: '/redoc',
        destination: `${backendUrl}/redoc`,
      },
      {
        source: '/openapi.json',
        destination: `${backendUrl}/openapi.json`,
      },
    ]
  },
}

export default nextConfig

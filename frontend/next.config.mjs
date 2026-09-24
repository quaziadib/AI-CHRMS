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
    const backendUrl = process.env.BACKEND_URL || 'http://backend:8000'
    return [
      {
        source: '/v1/:path*',
        destination: `${backendUrl}/v1/:path*`,
      },
    ]
  },
}

export default nextConfig

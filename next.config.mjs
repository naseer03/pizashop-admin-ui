/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pizzaapi.lefruit.in',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: 'https://pizzaapi.lefruit.in/v1/:path*',
      },
    ]
  },
}

export default nextConfig

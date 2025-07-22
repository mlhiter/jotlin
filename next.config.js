/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // domains: ['oss.laf.dev'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.HOST}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig

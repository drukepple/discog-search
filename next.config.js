const { hostname } = require('os')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.discogs.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.discogs.com',
        pathname: '/*',
      },
    ]
  }
}

module.exports = nextConfig

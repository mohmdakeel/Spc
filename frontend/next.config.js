/** @type {import('next').NextConfig} */
// Force lightningcss to use WASM (avoid missing native binary on this platform)
process.env.CSS_TRANSFORMER_WASM = 'true';

const nextConfig = {
  // Disable lightningcss (native binary missing on this platform); fall back to PostCSS
  experimental: {
    optimizeCss: false,
  },
  async rewrites() {
    return [
      // Auth service ↔ Spring Boot @8083
      {
        source: '/aapi/:path*',
        destination: `${process.env.NEXT_PUBLIC_AUTH_BASE || 'http://localhost:8083'}/api/:path*`,
      },
      // Transport service ↔ Spring Boot @8082
      {
        source: '/tapi/:path*',
        destination: `${process.env.NEXT_PUBLIC_TRANSPORT_BASE || 'http://localhost:8082'}/api/:path*`,
      },
    ];
  },

  async headers() {
    // Allow browser to send cookies (SPC_JWT) through Next.js proxy to Spring Boot
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return [
      {
        source: '/aapi/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: appOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
      {
        source: '/tapi/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: appOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

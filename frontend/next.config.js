/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Auth service (Spring Boot @ 8083)
      { source: '/aapi/:path*', destination: 'http://localhost:8083/api/:path*' },

      // Transport service (Spring Boot @ 8082)
      { source: '/tapi/:path*', destination: 'http://localhost:8082/api/:path*' },
    ];
  },
};
module.exports = nextConfig;

module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8081/api/:path*', // Ensure backend is running on port 8081
      },
    ];
  },
};

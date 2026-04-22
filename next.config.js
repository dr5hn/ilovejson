module.exports = {
  poweredByHeader: false,
  generateEtags: false,
  distDir: 'dist',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      // /api/docs → Swagger UI page
      { source: '/api/docs', destination: '/api-docs' },
    ];
  },
};

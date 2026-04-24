module.exports = {
  poweredByHeader: false,
  generateEtags: false,
  distDir: 'dist',
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      // /api/docs → Swagger UI page
      { source: '/api/docs', destination: '/api-docs' },
    ];
  },
};

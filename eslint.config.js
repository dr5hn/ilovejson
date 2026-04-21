import nextConfig from 'eslint-config-next'

export default [
  ...nextConfig,
  {
    ignores: ['src/generated/**', '.next/**', 'dist/**', 'node_modules/**'],
  },
]

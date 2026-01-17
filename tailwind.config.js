/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/components/**/*.jsx',
    './src/contexts/**/*.jsx',
    './pages/**/*.jsx'
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#1a1a1a',
          surface: '#2d2d2d',
          border: '#404040',
          text: '#e0e0e0',
          muted: '#a0a0a0',
        }
      }
    },
  },
  plugins: [],
}

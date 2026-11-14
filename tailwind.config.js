/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./demos/**/*.html",
    "./demos/**/*.js",
    "./assets/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Newsreader', 'serif'],
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        asuncion: {
          void: '#0e0d0c',
          surface: '#161412',
          card: '#1d1a17',
          hover: '#24201c',
          border: 'rgba(245, 241, 235, 0.08)',
          borderWarm: 'rgba(217, 119, 54, 0.3)',
          text: '#f5f1eb',
          muted: '#a8a299',
          subtle: '#8e8880',
          terracotta: '#c86a3d',
          cognac: '#e0a96d',
          gold: '#d97736',
          sand: '#d9cbb8'
        }
      }
    }
  },
  plugins: [],
}


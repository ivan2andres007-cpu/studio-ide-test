/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./simulador.html",
    "./demos/**/*.html",
    "./demos/**/*.js",
    "./tools/**/*.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bg: '#0C0B0A',
        surface: '#141210',
        card: '#141210',
        amber: {
          accent: '#DFA96E',
          hover: '#c99558'
        },
        cream: {
          text: '#F4EFE8',
          muted: '#A8A29A',
          subtle: 'rgba(244, 239, 232, 0.5)',
          border: 'rgba(244, 239, 232, 0.08)'
        }
      }
    }
  },
  plugins: [],
}

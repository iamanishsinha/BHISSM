/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bhissm: {
          bg: '#F8F1E7',
          surface: '#FFF9F1',
          accent: '#E8A7B5',
          pink: '#F4D5DC',
          dark: '#2D2926',
          secondary: '#514944',
          success: '#6F8B72',
          warning: '#C59655',
          critical: '#B65C62',
          border: '#D4C8BC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}

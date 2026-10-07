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
          // Surfaces
          bg: '#EFE8E0',        // bone page background
          surface: '#F6F0E9',   // card surface
          skin: '#E7CDB8',      // skin-tone fills
          pink: '#EFD3C2',      // soft skin tint (hover / highlight fills)
          border: '#D9C6B6',    // hairline borders
          // Ink
          dark: '#3A1517',      // primary text (deep maroon-brown)
          secondary: '#6B3A3A', // secondary text
          // Brand
          maroon: '#8A0F1A',
          'maroon-dark': '#6E0B14',
          accent: '#D2601F',    // burnt orange
          orange: '#D2601F',
          gold: '#F0B84A',      // mustard / yellow
          // Status
          success: '#6F8040',   // olive
          warning: '#E0A02E',
          critical: '#B3261E',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
        display: ['Anton', 'Bebas Neue', 'Impact', 'Haettenschweiler', 'Arial Narrow', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

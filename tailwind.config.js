/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          950: '#09140E',
          900: '#11241A',
          800: '#193527',
          700: '#244B37'
        },
        botanical: {
          leaf: '#22c55e',
          sage: '#84a98c',
          moss: '#52796f',
          forest: '#2f3e46',
          clay: '#d4a373',
          sand: '#faedcd',
          cream: '#FAF8F5'
        }
      },
      fontFamily: {
        sans: ['Heebo', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

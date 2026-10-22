/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#203B31',
          50: '#F2F5F3',
          100: '#E1E9E4',
          200: '#C3D3CA',
          300: '#9FB8AB',
          400: '#648874',
          500: '#3D5E4E',
          600: '#2F4E40',
          700: '#203B31', // Base forest
          800: '#182C25',
          900: '#101E19',
          950: '#0D1914',
        },
        ivory: {
          DEFAULT: '#F6F2E9',
          50: '#FFFFFF',
          100: '#FAF8F3',
          200: '#F6F2E9', // Base ivory
          300: '#EAE2D2',
          400: '#DCCAB2',
        },
        copper: {
          DEFAULT: '#BA855E',
          light: '#CE9E7A',
          dark: '#9B6A45',
        },
        sand: {
          DEFAULT: '#DCCAB2',
          light: '#E8DCCB',
          dark: '#C8B296',
        },
        charcoal: {
          DEFAULT: '#242724',
          muted: '#525752',
          light: '#7B817B',
        },
        paper: {
          DEFAULT: '#FFFCF7',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

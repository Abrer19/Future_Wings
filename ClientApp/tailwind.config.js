/** @type {import('tailwindcss').Config} */

// FutureWings design tokens.
//
// These are the documented brand colors, implemented here for the first time so
// they are available as named utilities (bg-primary, text-secondary-500, ...)
// instead of being repeated as arbitrary values per use site.
//
//   primary   #ff6b3d  orange       -> primary-500
//   secondary #51607a  slate blue   -> secondary-500
//   accent    #3b82f6  blue         -> accent
//   success   #10b981  green        -> success
//   warning   #f59e0b  amber        -> warning
//   danger    #ef4444  red          -> danger
//
// The 500 step of each scale is the documented value; the surrounding steps are
// tints/shades derived from it for hovers, borders, and surfaces.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff6b3d',
          50: '#fff4ee',
          100: '#ffe6d9',
          200: '#ffc9b0',
          300: '#ffa585',
          400: '#ff8a63',
          500: '#ff6b3d',
          600: '#e85c30',
          700: '#c24824',
          800: '#9a3a1f',
          900: '#7c311c',
          950: '#43170c',
        },
        secondary: {
          DEFAULT: '#51607a',
          50: '#f5f7f9',
          100: '#e9edf2',
          200: '#d3dae4',
          300: '#b0bccd',
          400: '#8593ab',
          500: '#51607a',
          600: '#47546b',
          700: '#3b4557',
          800: '#333b49',
          900: '#2d333e',
          950: '#1b2432',
        },
        accent: {
          DEFAULT: '#3b82f6',
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
        },
        success: {
          DEFAULT: '#10b981',
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          DEFAULT: '#f59e0b',
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          DEFAULT: '#ef4444',
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        surface: '#f5f7f8',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#10b981',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        // Category palette — distinguishable in light and dark
        cat: {
          economic: '#f59e0b',
          business: '#10b981',
          industry: '#3b82f6',
          consumer: '#ec4899',
          social: '#a855f7',
          technology: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(16,185,129,0.35), 0 8px 30px -6px rgba(16,185,129,0.45)',
        'glow-sm': '0 0 20px -4px rgba(16,185,129,0.5)',
      },
    },
  },
  plugins: [],
}

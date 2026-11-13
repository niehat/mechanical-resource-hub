/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f2f6fb', 100: '#e4ecf6', 200: '#c9d8ea', 300: '#a1b8d6', 400: '#7194bd',
          500: '#4c73a3', 600: '#375a85', 700: '#284468', 800: '#1a3050', 900: '#0d1f3c', 950: '#081529',
        },
        brand: {
          50: '#eef5ff', 100: '#d9e8ff', 200: '#b9d4ff', 300: '#8bb8fb', 400: '#5897f4',
          500: '#2f78e6', 600: '#1d62d0', 700: '#184fa9', 800: '#173f83', 900: '#16356a',
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(13,31,60,0.06), 0 6px 18px rgba(13,31,60,0.05)',
        lift: '0 2px 4px rgba(13,31,60,0.08), 0 12px 28px rgba(13,31,60,0.10)',
      },
    },
  },
  plugins: [],
};

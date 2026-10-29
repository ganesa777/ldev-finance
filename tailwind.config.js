/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
        },
        ink: '#0F2A43',
        muted: '#6B84A0',
        income: '#10B981',
        expense: '#F43F5E',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      boxShadow: {
        glass: '0 10px 40px -12px rgba(14,165,233,0.25)',
        float: '0 20px 50px -15px rgba(2,132,199,0.35)',
        glow: '0 0 0 4px rgba(56,189,248,0.25)',
      },
    },
  },
  plugins: [],
};
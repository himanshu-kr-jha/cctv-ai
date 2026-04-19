/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#6c63ff',
          dark: '#5b52e0',
          light: '#8b84ff',
          50: '#f0efff',
          100: '#e0dfff',
          200: '#c7c3ff',
          300: '#a5a0ff',
          400: '#8b84ff',
          500: '#6c63ff',
          600: '#5b52e0',
          700: '#4a43c0',
          800: '#3a35a0',
          900: '#2a2780',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        primary: {
          50: '#f0efff',
          100: '#e0dfff',
          200: '#c7c3ff',
          300: '#a5a0ff',
          400: '#8b84ff',
          500: '#6c63ff',
          600: '#5b52e0',
          700: '#4a43c0',
          800: '#3a35a0',
          900: '#2a2780',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-alert': 'pulseAlert 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseAlert: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(239, 68, 68, 0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(108, 99, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(108, 99, 255, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      borderRadius: {
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};

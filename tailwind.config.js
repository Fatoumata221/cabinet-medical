/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: '#e5e7eb',
        background: '#f8fafc',
        foreground: '#0f172a',
        medical: {
          primary: 'rgb(var(--medical-primary-rgb) / <alpha-value>)',
          'primary-dark': 'color-mix(in srgb, var(--medical-primary), black 20%)',
          secondary: 'rgb(var(--medical-secondary-rgb) / <alpha-value>)',
          'secondary-dark': 'color-mix(in srgb, var(--medical-secondary), black 20%)',
          accent: '#10b981',
          'accent-dark': '#059669',
          success: 'rgb(var(--medical-success-rgb) / <alpha-value>)',
          'success-dark': 'color-mix(in srgb, var(--medical-success), black 20%)',
          warning: 'rgb(var(--medical-warning-rgb) / <alpha-value>)',
          'warning-dark': 'color-mix(in srgb, var(--medical-warning), black 20%)',
          danger: 'rgb(var(--medical-danger-rgb) / <alpha-value>)',
          'danger-dark': 'color-mix(in srgb, var(--medical-danger), black 20%)',
          info: 'rgb(var(--medical-info-rgb) / <alpha-value>)',
          'info-dark': 'color-mix(in srgb, var(--medical-info), black 20%)',
          light: 'rgb(var(--medical-light-rgb) / <alpha-value>)',
          dark: 'rgb(var(--medical-dark-rgb) / <alpha-value>)',
          purple: '#a855f7',
          'purple-dark': '#9333ea',
          pink: '#ec4899',
          'pink-dark': '#db2777',
          indigo: '#6366f1',
          'indigo-dark': '#4f46e5',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-medical': 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)',
        'gradient-warning': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
        'gradient-danger': 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
        'gradient-purple': 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',
        'gradient-pink': 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      boxShadow: {
        'apple': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'apple-lg': '0 8px 32px rgba(0, 0, 0, 0.15)',
        'apple-xl': '0 16px 64px rgba(0, 0, 0, 0.2)',
        'medical': '0 4px 16px rgba(59, 130, 246, 0.15)',
        'success': '0 4px 16px rgba(16, 185, 129, 0.15)',
        'warning': '0 4px 16px rgba(245, 158, 11, 0.15)',
        'danger': '0 4px 16px rgba(239, 68, 68, 0.15)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'inner-light': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      backdropBlur: {
        'apple': '20px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}


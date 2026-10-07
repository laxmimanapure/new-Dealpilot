/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Newsreader"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Space Grotesk"', 'monospace'],
      },
      colors: {
        deepNavy: '#0F1E3A',
        darkBlue: '#162A4A',
        royalBlue: '#2457D6',
        electricBlue: '#3B82F6',
        softBlue: '#6E9FEF',
        powderBlue: '#A7B6D0',
        lightBlue: '#EAF1FF',
        offWhite: '#F8FAFC',
        navy: {
          DEFAULT: '#0F1E3A',
          primary: '#0F1E3A',
          secondary: '#162A4A',
          royal: '#2457D6',
          electric: '#3B82F6',
          soft: '#6E9FEF',
          powder: '#A7B6D0',
          light: '#EAF1FF',
          offwhite: '#F8FAFC',
        },
        mint: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
        },
        nude: {
          50: '#FAF8F5',
          100: '#F4F0EA',
          200: '#EAE3D9',
          300: '#DDD4C7',
          400: '#C8BBAA',
        }
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(circle, #3B82F6 1px, transparent 1px)",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.6) 100%)',
        'navy-glass': 'linear-gradient(135deg, rgba(22,42,74,0.85) 0%, rgba(15,30,58,0.95) 100%)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
}

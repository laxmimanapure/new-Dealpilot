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
        brand: {
          bg: '#FBF8F3',         // Warm Ivory / Cream Off-White
          card: '#FFFFFF',       // Pure White Surface
          dark: '#20284F',       // Deep Navy
          purple: '#352F6E',     // Dark Indigo Navy
          accent: '#7668D8',     // Soft Royal Purple
          pink: '#E88AAE',       // Soft Rose Pink
          gradientPink: '#AB70C5',
          muted: '#5A6588',      // Slate Navy Text
          border: '#EAE3D9',     // Warm Beige Border
          borderHover: '#7668D8',
          subtle: '#FAF6F0',     // Soft Cream Surface Tints
        },
        deepNavy: '#20284F',
        darkBlue: '#352F6E',
        royalBlue: '#7668D8',
        electricBlue: '#7668D8',
        softBlue: '#9D8FE6',
        powderBlue: '#D8D2FA',
        lightBlue: '#FAF6F0',
        offWhite: '#FBF8F3',
        navy: {
          DEFAULT: '#20284F',
          primary: '#20284F',
          secondary: '#352F6E',
          royal: '#7668D8',
          electric: '#7668D8',
          soft: '#9D8FE6',
          powder: '#D8D2FA',
          light: '#FAF6F0',
          offwhite: '#FBF8F3',
        },
        mint: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
        },
        nude: {
          50: '#FBF8F3',
          100: '#FAF6F0',
          200: '#EAE3D9',
          300: '#DDD4C7',
          400: '#C8BBAA',
        }
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(circle, #7668D8 1px, transparent 1px)",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(251,248,243,0.8) 100%)',
        'navy-glass': 'linear-gradient(135deg, rgba(53,47,110,0.9) 0%, rgba(32,40,79,0.95) 100%)',
        'brand-gradient': 'linear-gradient(to right, #20284F, #352F6E, #7668D8)',
        'brand-gradient-hover': 'linear-gradient(to right, #7668D8, #AB70C5, #E88AAE)',
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


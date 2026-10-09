import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // "Fiery Ocean" palette — primary brand red (fire) + secondary blue (ocean)
        ember: {
          50: '#fdf1ee',
          100: '#fbe0d8',
          200: '#f3b8ac',
          300: '#e8887a',
          400: '#d85a4a',
          500: '#c41e2e', // primary
          600: '#a01522',
          700: '#7a0e17', // headings, high-emphasis text
          800: '#5c0a10',
          900: '#3d0709',
        },
        ocean: {
          50: '#eef5fa',
          100: '#dcebf5',
          200: '#b7d7ea',
          300: '#93c0da',
          400: '#79a9c9',
          500: '#5c93b8', // secondary actions, success accents
          600: '#457897',
          700: '#345d75',
        },
        cream: {
          50: '#fbeeda',
          100: '#f5e2c4',
        },
        ink: {
          900: '#0e2a3d',
        },
      },
      fontFamily: {
        display: ['var(--font-fredoka)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 24px -8px rgba(61, 7, 9, 0.2)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;

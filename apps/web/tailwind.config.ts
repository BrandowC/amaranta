import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        amaranth: {
          50: '#fdf2f6',
          100: '#fce7ef',
          200: '#f9c9dc',
          300: '#f39dbe',
          400: '#ea6a99',
          500: '#d6336c', // primary
          600: '#b8215a',
          700: '#96184a',
          800: '#7a173e',
          900: '#521326',
        },
        sage: {
          50: '#f2f8f2',
          100: '#e0efe1',
          400: '#6fb384',
          500: '#4c9a6a',
          600: '#3a7d54',
        },
        cream: {
          50: '#fffaf3',
          100: '#fef3e7',
        },
        ink: {
          900: '#241521',
        },
      },
      fontFamily: {
        display: ['var(--font-fredoka)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 24px -8px rgba(82, 19, 38, 0.18)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;

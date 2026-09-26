import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        emerald: {
          dark: '#064E3B',
          deep: '#065F46'
        },
        burgundy: {
          DEFAULT: '#6B1A1A',
          dark: '#7F1D1D'
        },
        gold: {
          DEFAULT: '#B8860B',
          rich: '#D4AF37',
          light: '#F5D547'
        }
      },
      fontFamily: {
        serif: ['var(--font-playfair-display)', 'Playfair Display', 'serif'],
        sans: ['var(--font-inter)', 'Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bronze: {
          DEFAULT: '#A67C52',
          light: '#C4975A',
          dark: '#8B6F47',
        },
        surface: {
          light: '#FAFAF8',
          dark: '#14110F',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          muted: '#5A5A5A',
        },
        cream: {
          DEFAULT: '#EDEDED',
          muted: '#B5B5B5',
        },
        rim: {
          light: '#E5E2DC',
          dark: '#2A2A2A',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair-display)', 'Playfair Display', 'serif'],
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

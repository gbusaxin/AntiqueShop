import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        foreground: 'var(--fg)',
        muted: { foreground: 'var(--fg-muted)' },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--accent)',
        primary: { DEFAULT: 'rgb(var(--primary-rgb) / <alpha-value>)', foreground: 'var(--primary-foreground)' },
        // Storefront gallery palette — theme-aware (see globals.css)
        gold: {
          DEFAULT: 'rgb(var(--gold-rgb) / <alpha-value>)',
          rich: 'rgb(var(--gold-rich-rgb) / <alpha-value>)',
        },
        card: 'rgb(var(--card-rgb) / <alpha-value>)',
        deep: 'rgb(var(--deep-rgb) / <alpha-value>)',
        admin: {
          workspace: '#F5F1EA',
          card: '#FFFFFF',
          sidebar: '#1F1B17',
          ink: '#1A1A1A',
          muted: '#6B5F4F',
          bronze: '#8B6F47',
          border: '#D9D2C5',
        },
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
        display: ['var(--font-cormorant)', 'Cormorant Garamond', 'var(--font-playfair-display)', 'serif'],
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      transitionTimingFunction: {
        lux: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        'page-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'fade-in': {
          from: { opacity: '0' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        'scroll-cue': {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '45%': { transform: 'scaleY(1)', transformOrigin: 'top' },
          '55%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(0)', transformOrigin: 'bottom' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        'spin-slow': 'spin-slow 40s linear infinite',
        'page-in': 'page-in .6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in .7s ease both',
        shimmer: 'shimmer 2.2s linear infinite',
        'scroll-cue': 'scroll-cue 2.4s cubic-bezier(0.65, 0, 0.35, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;

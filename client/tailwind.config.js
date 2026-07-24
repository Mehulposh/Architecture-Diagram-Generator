/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // rgb(var(...) / <alpha-value>) is the Tailwind-documented pattern for
        // CSS-variable-backed theme colors that still support opacity
        // modifiers (bg-blueprint-900/60, text-paper/80, etc) — the actual
        // R/G/B values live in :root / [data-theme='light'] in index.css, so
        // switching the data-theme attribute re-themes every existing usage
        // of these tokens across the whole app with no component changes.
        blueprint: {
          950: 'rgb(var(--bp-950-rgb) / <alpha-value>)',
          900: 'rgb(var(--bp-900-rgb) / <alpha-value>)',
          800: 'rgb(var(--bp-800-rgb) / <alpha-value>)',
          700: 'rgb(var(--bp-700-rgb) / <alpha-value>)',
          line: 'rgb(var(--bp-line-rgb) / <alpha-value>)',
        },
        paper: 'rgb(var(--bp-paper-rgb) / <alpha-value>)',
        amber: 'rgb(var(--bp-amber-rgb) / <alpha-value>)',
        // Node/role accent colors are semantic (identify a component TYPE,
        // e.g. "database is amber"), not part of the light/dark theme, so
        // they intentionally stay fixed hex across both themes.
        node: {
          frontend: '#8B7CF6',
          backend: '#2FB8AC',
          database: '#F2A93B',
          cache: '#F45B69',
          queue: '#9B5DE5',
          gateway: '#3A86FF',
          balancer: '#00B4A6',
          cloud: '#4CC9F0',
          external: '#8D99AE',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        blueprint: 'linear-gradient(rgba(62,111,168,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(62,111,168,0.18) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '28px 28px',
      },
    },
  },
  plugins: [],
};
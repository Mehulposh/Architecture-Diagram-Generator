/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        blueprint: {
          950: '#081428',
          900: '#0B1E3D',
          800: '#122A4E',
          700: '#1B3B67',
          line: '#3E6FA8',
        },
        paper: '#F3EFE4',
        amber: '#F2A93B',
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
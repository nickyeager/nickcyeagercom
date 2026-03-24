/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#101010',
          surface: '#161616',
          border: '#2A2A2A',
          green: '#6EBF8B',
          dim: '#4A9168',
          cyan: '#7EB8C9',
          text: '#DCDCDC',
          muted: '#7A7A7A',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

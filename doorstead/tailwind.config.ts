import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50: '#f4f7f6',
          100: '#e3ebe9',
          200: '#c7d7d3',
          600: '#3f6b62',
          700: '#33564f',
          800: '#2b463f',
          900: '#243a34',
        },
      },
    },
  },
  plugins: [],
}

export default config

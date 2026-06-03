import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#07080C',
        foreground: '#F4F4F5',
        muted: '#A1A1AA',
        accent: '#5B8DEF',
        card: '#111318',
        border: '#27272A',
      },
    },
  },
  plugins: [],
}
export default config

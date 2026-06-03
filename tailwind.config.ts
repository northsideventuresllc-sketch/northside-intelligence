import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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
        ni: {
          bg: "#07080C",
          navy: "#0A1628",
          cyan: "#00D4FF",
          "cyan-dim": "#00A8CC",
          muted: "#8B95A8",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "grid-pulse": "grid-pulse 8s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        "grid-pulse": {
          "0%, 100%": { opacity: "0.15" },
          "50%": { opacity: "0.35" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(0, 212, 255, 0.15)",
        "glow-sm": "0 0 20px rgba(0, 212, 255, 0.2)",
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
};

export default config;
}
export default config

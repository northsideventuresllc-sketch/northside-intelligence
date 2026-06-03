import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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
        "scan-line": "scan-line 8s linear infinite",
        shimmer: "shimmer 3s ease-in-out infinite",
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
        "scan-line": {
          "0%": { transform: "translateY(-100vh)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(0, 212, 255, 0.15)",
        "glow-sm": "0 0 20px rgba(0, 212, 255, 0.2)",
        "glow-lg": "0 0 80px rgba(0, 212, 255, 0.25)",
        "3d-inset": "inset 0 1px 0 rgba(0, 212, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.3)",
      },
      perspective: {
        DEFAULT: "1000px",
        near: "600px",
        far: "2000px",
      },
    },
  },
  plugins: [],
};

export default config;

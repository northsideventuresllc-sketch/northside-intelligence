import { PORTAL_URL } from "@/lib/sector3-registry";
import { BRAND, getCopyrightYear } from "@/lib/constants";

/** Design tokens aligned with tailwind.config.ts and globals.css */
export const NI_EMAIL = {
  colors: {
    bg: "#07080C",
    navy: "#0A1628",
    cyan: "#00D4FF",
    cyanDim: "#00A8CC",
    cyanSoft: "#67E8F9",
    text: "#E8EAEF",
    muted: "#8B95A8",
    white: "#FFFFFF",
    border: "rgba(0, 212, 255, 0.15)",
    borderStrong: "rgba(0, 212, 255, 0.35)",
    buttonBg: "rgba(0, 212, 255, 0.12)",
    buttonBorder: "rgba(0, 212, 255, 0.4)",
  },
  fonts: {
    sans:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  },
  layout: {
    maxWidth: 600,
    radius: 16,
    contentPadding: 32,
  },
  urls: {
    portal: PORTAL_URL,
    logo: `${PORTAL_URL}/logo-full.png`,
    emblem: `${PORTAL_URL}/logo.png`,
    terms: `${PORTAL_URL}/legal/terms`,
    privacy: `${PORTAL_URL}/legal/privacy`,
    support: "mailto:support@northsideintelligence.com",
  },
  copy: {
    company: BRAND.company,
    tagline: BRAND.tagline,
    copyrightYear: getCopyrightYear(),
    venturesGroup: BRAND.venturesGroup,
  },
} as const;

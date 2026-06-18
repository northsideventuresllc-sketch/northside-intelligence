export const STORE_PLATFORM_LABELS: Record<string, string> = {
  cj: "CJ Dropshipping",
  spocket: "Spocket",
  zendrop: "Zendrop",
  amazon: "Amazon",
  curated: "NI Deals",
};

export const DROPSHIP_SOURCE_PLATFORMS = [
  { id: "cj", label: "CJ Dropshipping", enabled: true },
  { id: "spocket", label: "Spocket", enabled: true },
  { id: "zendrop", label: "Zendrop", enabled: true },
] as const;

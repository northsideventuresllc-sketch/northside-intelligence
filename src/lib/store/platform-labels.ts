export const STORE_PLATFORM_LABELS: Record<string, string> = {
  cj: "CJ Dropshipping",
  aliexpress: "AliExpress",
  temu: "Temu",
  amazon: "Amazon",
  curated: "NI Deals",
};

export const DROPSHIP_SOURCE_PLATFORMS = [
  { id: "cj", label: "CJ Dropshipping", enabled: true },
  { id: "aliexpress", label: "AliExpress", enabled: true },
  { id: "temu", label: "Temu", enabled: true },
] as const;

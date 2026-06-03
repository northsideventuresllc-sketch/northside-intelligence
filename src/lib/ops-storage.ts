export const OPS_STORAGE_KEYS = {
  sector3Revenue: "ni_ops_sector3_revenue",
  matchFitRevenue: "ni_ops_matchfit_revenue",
  currentMrr: "ni_ops_current_mrr",
  breakdown: "ni_ops_revenue_breakdown",
} as const;

export interface RevenueBreakdown {
  matchFit: number;
  sector3: number;
  sector1B: number;
  sector2: number;
}

const DEFAULT_BREAKDOWN: RevenueBreakdown = {
  matchFit: 0,
  sector3: 0,
  sector1B: 0,
  sector2: 0,
};

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadBreakdown(): RevenueBreakdown {
  return loadFromStorage(OPS_STORAGE_KEYS.breakdown, DEFAULT_BREAKDOWN);
}

export function loadNumber(key: string, fallback = 0): number {
  const value = loadFromStorage<number | null>(key, null);
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

export function saveNumber(key: string, value: number): void {
  saveToStorage(key, value);
}

export function saveBreakdown(breakdown: RevenueBreakdown): void {
  saveToStorage(OPS_STORAGE_KEYS.breakdown, breakdown);
}

export function calcProgressPercent(currentMrr: number, goal: number): number {
  if (goal <= 0) return 0;
  const annualized = currentMrr * 12;
  return Math.min(100, Math.round((annualized / goal) * 1000) / 10);
}

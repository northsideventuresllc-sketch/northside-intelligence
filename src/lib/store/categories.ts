/** Internal Smart Store product categories (not supplier taxonomy). */

export const STORE_ITEM_CATEGORIES = [
  { id: "kitchen", label: "Kitchen" },
  { id: "tech", label: "Tech" },
  { id: "home", label: "Home" },
  { id: "pets", label: "Pets" },
  { id: "health", label: "Health" },
  { id: "beauty", label: "Beauty" },
  { id: "fitness", label: "Fitness" },
  { id: "auto", label: "Auto" },
  { id: "entertainment", label: "Entertainment" },
  { id: "smart-home", label: "Smart Home" },
  { id: "general", label: "General" },
] as const;

export type StoreCategoryId = (typeof STORE_ITEM_CATEGORIES)[number]["id"];

const STORE_CATEGORY_ID_SET = new Set<string>(STORE_ITEM_CATEGORIES.map((c) => c.id));

export function isStoreCategoryId(value: string): value is StoreCategoryId {
  return STORE_CATEGORY_ID_SET.has(value);
}

export function formatCategoryLabel(category: string): string {
  const match = STORE_ITEM_CATEGORIES.find((c) => c.id === category);
  if (match) return match.label;
  return category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

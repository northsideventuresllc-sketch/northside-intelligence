export interface Sector3ToolRuntimeConfig {
  slug: string;
  displayName: string;
  basePath: string;
  profileTable: string;
  sessionsTable: string;
  usageColumn: string;
  resetColumn: string;
  usageUnit: string;
  freeTierCap: number;
}

export interface Sector3SessionRow {
  id: string;
  input_summary: string;
  result_text: string;
  created_at: string;
}

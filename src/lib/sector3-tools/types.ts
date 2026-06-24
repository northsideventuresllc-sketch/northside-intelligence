export interface Sector3ToolHelpFaq {
  question: string;
  answer: string;
}

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
  /** Short dashboard footer copy — what this tool is for. */
  summary: string;
  faqs: Sector3ToolHelpFaq[];
}

export interface Sector3SessionRow {
  id: string;
  input_summary: string;
  result_text: string;
  created_at: string;
}

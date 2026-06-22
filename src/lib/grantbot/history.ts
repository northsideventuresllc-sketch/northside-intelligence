export type GrantBotMode = "search" | "draft";

export interface GrantBotHistoryEntry {
  id: string;
  mode: GrantBotMode;
  orgDescription: string;
  category: string;
  grantTitle?: string;
  funder?: string;
  promptQuestions?: string;
  resultText: string;
  createdAt: string;
}

interface GrantBotHistoryRow {
  id: string;
  mode: GrantBotMode;
  org_description: string;
  category: string;
  grant_title: string | null;
  funder: string | null;
  prompt_questions: string | null;
  result_text: string;
  created_at: string;
}

export function mapGrantBotHistoryRow(row: GrantBotHistoryRow): GrantBotHistoryEntry {
  return {
    id: row.id,
    mode: row.mode,
    orgDescription: row.org_description,
    category: row.category,
    grantTitle: row.grant_title ?? undefined,
    funder: row.funder ?? undefined,
    promptQuestions: row.prompt_questions ?? undefined,
    resultText: row.result_text,
    createdAt: row.created_at,
  };
}

export const GRANTBOT_HISTORY_LIMIT = 50;

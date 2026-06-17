export interface ReplyFlowHistoryEntry {
  id: string;
  customerMessage: string;
  tone: string;
  scenario: string;
  generatedReply: string;
  createdAt: string;
}

interface ReplyFlowHistoryRow {
  id: string;
  customer_message: string;
  tone: string;
  scenario: string;
  generated_reply: string;
  created_at: string;
}

export function mapReplyFlowHistoryRow(row: ReplyFlowHistoryRow): ReplyFlowHistoryEntry {
  return {
    id: row.id,
    customerMessage: row.customer_message,
    tone: row.tone,
    scenario: row.scenario,
    generatedReply: row.generated_reply,
    createdAt: row.created_at,
  };
}

export const REPLYFLOW_HISTORY_LIMIT = 50;

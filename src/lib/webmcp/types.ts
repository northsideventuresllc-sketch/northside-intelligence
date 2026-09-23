import type { NextRequest } from "next/server";
import type { createServiceClient } from "@/lib/supabase/server";

export type ManifestTool = {
  name: string;
  description: string;
  sector: string;
  product: string;
  parameters?: { type: "object"; properties?: Record<string, unknown>; required?: string[] };
  floor_price_usd: number;
  target_url: string;
};

export type ToolContext = {
  engine: string;
  signature: string;
  req: NextRequest;
  supabase: ReturnType<typeof createServiceClient> | null;
  naturalQuery?: string;
};

/**
 * Every tool returns one of these. Never report "active"/"confirmed" unless money
 * has actually been collected (Stripe webhook) — use awaiting_payment + checkout_url.
 */
export type ToolResult =
  | { status: "ok"; data: Record<string, unknown>; message?: string }
  | { status: "awaiting_payment"; checkout_url: string; order_id: string; amount_usd: number; message: string }
  | { status: "unavailable"; message: string }
  | { status: "invalid_input"; message: string };

export type ToolHandler = (
  tool: ManifestTool,
  params: Record<string, unknown>,
  ctx: ToolContext
) => Promise<ToolResult>;

/** Runs after payment is confirmed (called by ni_order_status). `order` is the paid Stripe Checkout Session. */
export type FulfilHandler = (
  order: { id: string; customer_email: string | null; amount_total: number | null; metadata: Record<string, string> },
  params: Record<string, unknown>,
  ctx: ToolContext
) => Promise<Record<string, unknown>>;

export type ToolModule = { handler: ToolHandler; fulfil?: FulfilHandler };

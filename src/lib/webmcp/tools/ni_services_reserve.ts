import { getServiceBySlug } from "@/lib/services/offerings";
import { COMPETITIVE_DISCOUNT, FLOOR_RATIO, SERVICE_MARKET_RATES_CENTS } from "@/lib/services/market-rates";
import { createWebmcpCheckout } from "../checkout";
import type { FulfilHandler, ToolHandler } from "../types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Deposit = 20% of the service's lowest acceptable price (JB, 2026-09-23), rounded to $10, min $50.
// Lowest price mirrors pricing-engine: market rate x (1 - competitive discount) x floor ratio.
const DEPOSIT_SHARE = 0.2;
const MIN_DEPOSIT_CENTS = 5000;
// Stripe metadata caps each value at 500 chars; keep notes short enough to fit with the other params.
const MAX_NOTES_CHARS = 200;

export function depositCentsFor(slug: string): number | null {
  const market = SERVICE_MARKET_RATES_CENTS[slug];
  if (!market) return null;
  const floor = market * (1 - COMPETITIVE_DISCOUNT) * FLOOR_RATIO;
  return Math.max(MIN_DEPOSIT_CENTS, Math.round((floor * DEPOSIT_SHARE) / 1000) * 1000);
}

/**
 * The published webmcp.json manifest's `service_type` enum uses its own short
 * codes (custom_web_design, tailored_intelligence_server, ...) that don't match
 * the real offering slugs in src/lib/services/offerings.ts. Mapped here so a
 * caller following the manifest still resolves to a real, live offering.
 * Sector 2 EDUCATION is intentionally not offered — every entry below is a
 * Sector 2 SERVICES offering that exists in INTELLIGENCE_SERVICES.
 */
const SERVICE_TYPE_TO_SLUG: Record<string, string> = {
  custom_web_design: "custom-web-design-management",
  tailored_intelligence_server: "tailored-intelligence-server",
  intelligence_audit_gap_analysis: "intelligence-audit",
  workflow_integration_automation: "workflow-integration",
  personal_intelligence_setup: "personal-intelligence-setup",
};

export const handler: ToolHandler = async (_tool, params) => {
  const rawType = typeof params.service_type === "string" ? params.service_type.trim() : "";
  const slug = SERVICE_TYPE_TO_SLUG[rawType];
  const service = slug ? getServiceBySlug(slug) : undefined;
  if (!service) {
    return {
      status: "invalid_input",
      message: `service_type must be one of: ${Object.keys(SERVICE_TYPE_TO_SLUG).join(", ")}.`,
    };
  }

  const clientName = typeof params.client_name === "string" ? params.client_name.trim() : "";
  if (!clientName) {
    return { status: "invalid_input", message: "client_name is required." };
  }

  const clientEmail = typeof params.client_email === "string" ? params.client_email.trim() : "";
  if (!clientEmail || !EMAIL_RE.test(clientEmail)) {
    return { status: "invalid_input", message: "client_email must be a valid email address." };
  }

  const projectNotes =
    typeof params.project_notes === "string" ? params.project_notes.trim().slice(0, MAX_NOTES_CHARS) : "";

  const depositCents = depositCentsFor(service.slug);
  if (!depositCents) return { status: "unavailable", message: `${service.name} can't be reserved online yet.` };

  return createWebmcpCheckout({
    tool: "ni_services_reserve",
    mode: "payment",
    amountCents: depositCents,
    productName: `${service.name} — Reservation Deposit`,
    customerEmail: clientEmail,
    params: { service_type: rawType, service_slug: slug, client_name: clientName, client_email: clientEmail, project_notes: projectNotes },
  });
};

/**
 * Confirms the deposit was received and hands off to JB — never emails or
 * messages the client, never writes to outreach_leads. The real scoped quote
 * and full engagement still happen off this tool, by JB following up directly.
 */
export const fulfil: FulfilHandler = async (order, params) => {
  const serviceSlug = typeof params.service_slug === "string" ? params.service_slug : "";
  const service = serviceSlug ? getServiceBySlug(serviceSlug) : undefined;
  const clientName = typeof params.client_name === "string" ? params.client_name : "";
  const clientEmail =
    typeof params.client_email === "string" && params.client_email
      ? params.client_email
      : order.customer_email ?? "";
  const depositUsd = (order.amount_total ?? 0) / 100;

  return {
    message:
      `Deposit of $${depositUsd.toFixed(0)} received for ${service?.name ?? "the requested service"}. ` +
      "This is a reservation only, not a final price. Northside Intelligence (JB) will follow up " +
      "directly with the client to scope the project and confirm the full quote.",
    service: service?.name ?? serviceSlug,
    client_name: clientName,
    client_email: clientEmail,
    deposit_usd: depositUsd,
  };
};

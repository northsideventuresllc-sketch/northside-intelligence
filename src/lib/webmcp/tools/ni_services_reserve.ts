import { getServiceBySlug } from "@/lib/services/offerings";
import { createWebmcpCheckout } from "../checkout";
import type { FulfilHandler, ToolHandler } from "../types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export const handler: ToolHandler = async (tool, params) => {
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
    typeof params.project_notes === "string" ? params.project_notes.trim().slice(0, 2000) : "";

  // src/lib/services/pricing-engine.ts has no fixed "deposit" concept at all —
  // real pricing is a dynamic quote (ni_service_quotes) generated only after an
  // authenticated NI Portal intake form, and the real checkout
  // (src/app/api/services/checkout/route.ts) charges that quote's full/plan/bnpl
  // price, never a flat deposit. There is no per-service deposit amount anywhere
  // in the services code to read, so per instructions this uses the manifest's
  // own tool-level floor_price_usd as the reservation deposit rather than
  // inventing a number.
  const depositUsd = tool.floor_price_usd;
  const depositCents = Math.round(depositUsd * 100);

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

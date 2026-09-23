import { generateGapScanReport } from "@/lib/sector3-tools/ai";
import { computeToolPricingFromProfile } from "@/lib/billing/tool-pricing";
import { getSector3ToolProfile } from "@/lib/billing/sector3-tool-pricing";
import { createWebmcpCheckout } from "../checkout";
import type { FulfilHandler, ToolHandler } from "../types";

const DEFAULT_SCAN_TYPE = "Website";

type UrlCheck = { ok: true; url: string; domain: string } | { ok: false; message: string };

/** Manifest requires `target_domain`. Accept a bare domain or a full http(s) URL. */
function normalizeTargetDomain(raw: unknown): UrlCheck {
  if (typeof raw !== "string" || !raw.trim()) {
    return {
      ok: false,
      message: "target_domain is required — the domain or URL of the company/site to audit (e.g. \"acme.com\" or \"https://acme.com\").",
    };
  }
  const trimmed = raw.trim();
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, message: "target_domain must be a valid http(s) URL or domain." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, message: "target_domain must use http or https." };
  }
  if (!parsed.hostname.includes(".")) {
    return { ok: false, message: "target_domain must be a real domain (e.g. \"acme.com\")." };
  }
  return { ok: true, url: parsed.toString(), domain: parsed.hostname };
}

/**
 * GapScan — single-purchase gap audit for a target company URL/domain.
 * The manifest also advertises "standard"/"agentic" recurring tiers and a `payment_token`
 * field; neither is wired up — this webmcp flow only ever sells a one-time single scan via
 * guest Stripe Checkout (createWebmcpCheckout), same as every other webmcp tool. If `tier`
 * asks for a subscription, we still sell the single scan and say so in the message.
 */
export const handler: ToolHandler = async (tool, params) => {
  const domainCheck = normalizeTargetDomain(params.target_domain);
  if (!domainCheck.ok) return { status: "invalid_input", message: domainCheck.message };

  const scanTypeRaw = typeof params.scanType === "string" ? params.scanType.trim() : "";
  const scanType = scanTypeRaw || DEFAULT_SCAN_TYPE;

  const profile = getSector3ToolProfile("gapscan");
  const pricing = computeToolPricingFromProfile(profile);
  if (!profile || !pricing) {
    return { status: "unavailable", message: "GapScan pricing is not configured." };
  }

  const requestedTier = typeof params.tier === "string" ? params.tier.trim() : "";
  const tierNote =
    requestedTier && requestedTier !== "single_scan"
      ? ` Only a one-time single scan (no recurring "${requestedTier}" plan) is available through this agent checkout.`
      : "";

  const result = await createWebmcpCheckout({
    tool: tool.name,
    productName: `GapScan — Single Scan (${domainCheck.domain})`,
    mode: "payment",
    amountCents: Math.round(pricing.monthlyPriceUsd * 100),
    params: { target_domain: domainCheck.domain, target_url: domainCheck.url, scanType },
  });

  if (result.status === "awaiting_payment" && tierNote) {
    return { ...result, message: `${result.message}${tierNote}` };
  }
  return result;
};

export const fulfil: FulfilHandler = async (_order, params) => {
  const domain = typeof params.target_domain === "string" ? params.target_domain : "";
  const url = typeof params.target_url === "string" && params.target_url ? params.target_url : domain ? `https://${domain}` : "";
  const scanTypeRaw = typeof params.scanType === "string" ? params.scanType.trim() : "";
  const scanType = scanTypeRaw || DEFAULT_SCAN_TYPE;

  const context = [
    `Target company: ${domain || url}`,
    `Target URL: ${url || domain}`,
    "",
    "Perform a digital and intelligence gap audit of this target based on its public web presence, product/market positioning, and likely feature or workflow gaps versus comparable competitors.",
  ].join("\n");

  const report = await generateGapScanReport(context, scanType);
  return {
    tool: "GapScan",
    target_domain: domain,
    target_url: url,
    scan_type: scanType,
    report,
  };
};

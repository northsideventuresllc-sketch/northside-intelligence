import { REPLYFLOW_PRICE_IDS } from "@/lib/replyflow/stripe";
import { portalSignInUrl, portalSignUpUrl } from "@/lib/replyflow/auth";
import { createWebmcpCheckout } from "../checkout";
import type { FulfilHandler, ToolHandler } from "../types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ReplyflowPlan = keyof typeof REPLYFLOW_PRICE_IDS; // "solo" | "team" | "agency"

const PLAN_LABELS: Record<ReplyflowPlan, string> = {
  solo: "Solo",
  team: "Team",
  agency: "Agency",
};

/**
 * The published webmcp.json manifest documents `tier` as one of
 * standard/agentic/core_bundle_agentic/pro_bundle_agentic/power_bundle_agentic —
 * none of which are real ReplyFlow Stripe plans (see src/lib/replyflow/stripe.ts,
 * REPLYFLOW_PRICE_IDS: solo/team/agency). This alias table accepts the real plan
 * names as canonical and best-effort maps the manifest's stale names onto them so
 * an agent following the published manifest still gets a working checkout. This
 * is a manifest bug, not a tool bug — see lane-1 final report.
 */
const TIER_ALIASES: Record<string, ReplyflowPlan> = {
  solo: "solo",
  team: "team",
  agency: "agency",
  standard: "solo",
  agentic: "team",
  core_bundle_agentic: "team",
  pro_bundle_agentic: "agency",
  power_bundle_agentic: "agency",
};

export const handler: ToolHandler = async (_tool, params) => {
  const email = typeof params.account_email === "string" ? params.account_email.trim() : "";
  if (!email || !EMAIL_RE.test(email)) {
    return { status: "invalid_input", message: "account_email must be a valid email address." };
  }

  const rawTier = typeof params.tier === "string" ? params.tier.trim().toLowerCase() : "";
  const plan = TIER_ALIASES[rawTier];
  if (!plan) {
    return {
      status: "invalid_input",
      message:
        'tier must resolve to a real ReplyFlow plan: "solo", "team", or "agency" ' +
        `(got ${JSON.stringify(params.tier ?? null)}).`,
    };
  }

  const priceId = REPLYFLOW_PRICE_IDS[plan];

  return createWebmcpCheckout({
    tool: "ni_replyflow_subscribe",
    mode: "subscription",
    priceId,
    productName: `ReplyFlow — ${PLAN_LABELS[plan]}`,
    customerEmail: email,
    params: { account_email: email, plan },
  });
};

/**
 * Runs once Stripe confirms the subscription is paid. Never claims the ReplyFlow
 * account is "active" here — a webmcp guest checkout has no NI Portal user id in
 * its Stripe metadata, so the existing replyflow webhook
 * (src/app/api/replyflow/webhooks/stripe/route.ts, checkout.session.completed)
 * cannot link this subscription to a portal profile automatically. The buyer
 * still has to sign in with the paid email to be provisioned.
 */
export const fulfil: FulfilHandler = async (order, params) => {
  const email =
    typeof params.account_email === "string" && params.account_email
      ? params.account_email
      : order.customer_email ?? "";
  const plan = typeof params.plan === "string" ? params.plan : "";

  return {
    message:
      `Payment received — a ReplyFlow ${plan || "subscription"} plan was purchased. ` +
      "To use it, sign in (or create a free account if this is the first time) at the NI Portal " +
      "using the exact same email address used at checkout. Subscriptions are matched to an " +
      "account by that email — there is no separate access token from this call.",
    account_email: email,
    sign_in_url: portalSignInUrl(),
    sign_up_url: portalSignUpUrl(),
  };
};

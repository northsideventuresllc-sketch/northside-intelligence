import "server-only";

import { SMART_STORE_NAME } from "@/lib/store/branding";
import type { StoreGateStatus } from "@/lib/store/types";

export type { StoreGateStatus } from "@/lib/store/types";

export function isCjDropshippingWired(): boolean {
  return Boolean(process.env.CJ_DROPSHIPPING_API_KEY?.trim());
}

/** True when Make.com store fulfillment webhook is configured (not a placeholder). */
export function isMakeStoreWebhookConfigured(): boolean {
  const url = process.env.MAKE_STORE_WEBHOOK_URL?.trim();
  if (!url) return false;
  if (url.includes("placeholder")) return false;
  return true;
}

/** Manual launch flag — must be explicitly enabled. */
export function isStoreLaunchFlagSet(): boolean {
  const flag = process.env.NI_STORE_LIVE?.trim().toLowerCase();
  return flag === "true" || flag === "1";
}

/** Store checkout is live only when CJ, Make, and launch flag are all set. */
export function isStoreCheckoutLive(): boolean {
  return isCjDropshippingWired() && isMakeStoreWebhookConfigured() && isStoreLaunchFlagSet();
}

export function getStoreGateStatus(): StoreGateStatus {
  const cjWired = isCjDropshippingWired();
  const makeConfigured = isMakeStoreWebhookConfigured();
  const launchFlag = isStoreLaunchFlagSet();
  const live = cjWired && makeConfigured && launchFlag;

  let message = `${SMART_STORE_NAME} is coming soon. Preview products are shown — checkout opens after fulfillment is wired.`;
  if (live) {
    message = `${SMART_STORE_NAME} checkout is live.`;
  } else if (!cjWired) {
    message = `Coming soon — CJDropshipping is not configured yet. Preview products only; ${SMART_STORE_NAME} checkout is disabled.`;
  } else if (!makeConfigured) {
    message = `Coming soon — order fulfillment automation (Make.com) is not configured yet. ${SMART_STORE_NAME} checkout is disabled.`;
  } else if (!launchFlag) {
    message = `Coming soon — launch flag is off. Preview products only; ${SMART_STORE_NAME} checkout is disabled.`;
  }

  return { live, cjWired, makeConfigured, launchFlag, message };
}

/** Server-side checkout guard (includes env gate + mock SKU check). */
export function canCheckoutProductServer(product: { isMock: boolean }): boolean {
  if (product.isMock) return false;
  return isStoreCheckoutLive();
}

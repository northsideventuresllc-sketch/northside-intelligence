/** Permanent unlimited access tier for designated NI accounts. */
export const MASTER_ACCOUNT_LABEL = "Master Account User";

export const MASTER_ACCOUNT_DESCRIPTION =
  "Permanent and unlimited access to all Sector 3 intelligence tools, plus every future agent and education product released on Northside Intelligence.";

export function isMasterAccountFlag(value: boolean | null | undefined): boolean {
  return value === true;
}

/** Master accounts receive access to any NI product slug (tools, agents, education). */
export function masterAccountHasProductAccess(
  isMasterAccount: boolean,
  _productSlug?: string
): boolean {
  return isMasterAccount;
}

/** Permanent unlimited access tier for designated NI accounts. */
export const MASTER_ACCOUNT_LABEL = "Master Account User";

export const MASTER_ACCOUNT_DESCRIPTION =
  "Permanent and unlimited access to all Intelligence Tools and future NI products released on Northside Intelligence.";

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

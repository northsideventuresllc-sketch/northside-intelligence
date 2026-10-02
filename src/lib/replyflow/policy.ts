import "server-only";

export interface CompanyPolicyContext {
  companyName: string;
  refundPolicy: string;
  turnaroundSla: string;
  escalationContact: string;
  customRules: string[];
}

export const DEFAULT_POLICY_CONTEXT: CompanyPolicyContext = {
  companyName: "Northside Intelligence",
  refundPolicy: "Full refund within 14 days of purchase if service standards are not met.",
  turnaroundSla: "Priority support responses guaranteed within 4 hours; standard inquiries within 24 hours.",
  escalationContact: "support@northsideintelligence.com",
  customRules: [
    "Never make promises about unreleased product features without engineering sign-off.",
    "Always offer self-service documentation links alongside custom explanations.",
    "Adhere to customer privacy standards—never ask for passwords or full card details.",
  ],
};

/**
 * Builds policy-conditioned prompt instructions to prevent rogue LLM hallucinated commitments.
 */
export function buildPolicyInstructionBlock(policy?: Partial<CompanyPolicyContext>): string {
  const merged: CompanyPolicyContext = {
    ...DEFAULT_POLICY_CONTEXT,
    ...policy,
  };

  return `COMPANY OPERATING POLICIES & BOUNDARIES:
- Organization: ${merged.companyName}
- Refund Policy: ${merged.refundPolicy}
- Guaranteed Support SLA: ${merged.turnaroundSla}
- Official Escalation Channel: ${merged.escalationContact}
- Internal Rules:
${merged.customRules.map((r) => `  * ${r}`).join("\n")}

CRITICAL INSTRUCTION: You must strictly abide by these company policies. NEVER offer unauthorized discounts, refunds outside the policy window, or unreleased timeline commitments.`;
}

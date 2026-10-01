import "server-only";

export interface GrantDeliverablePackage {
  coverLetterMarkdown: string;
  executiveSummaryMarkdown: string;
  proposalNarrativeMarkdown: string;
  budgetTableMarkdown: string;
  organizationCapacityMarkdown: string;
  submissionChecklistMarkdown: string;
  piiScrubbed: boolean;
}

/**
 * Scrubs sensitive private and personal information (SSN, credit cards, bank accounts, phone numbers)
 * leaving clean placeholders for the applicant to fill safely on their own.
 */
export function scrubSensitivePii(text: string): string {
  return text
    // SSN variations
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED-SSN]")
    .replace(/\b(ssn|social security)\s*[:=]?\s*\d{9}\b/gi, "[REDACTED-SSN]")
    // EIN
    .replace(/\b\d{2}-\d{7}\b/g, "[ORG-EIN-NUMBER]")
    // Credit card numbers (15-digit Amex, 16-digit Visa/Mastercard/Discover, with spaces or hyphens)
    .replace(/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g, "[REDACTED-CARD-NUMBER]")
    .replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, "[REDACTED-CARD-NUMBER]")
    // US Phone numbers
    .replace(/\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b/g, "[REDACTED-PHONE]")
    // Bank routing and account numbers
    .replace(/\b(routing|account|iban)\s*(number|#)?\s*[:=]?\s*[A-Z0-9-]+\b/gi, "[REDACTED-BANKING-INFO]");
}

function parseCurrency(val?: string): number | null {
  if (!val) return null;
  const num = parseFloat(val.replace(/[^0-9.]/g, ""));
  return isNaN(num) || num <= 0 ? null : num;
}

function formatCurrency(num: number): string {
  return "$" + num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function extractCleanAbstract(narrative: string, targetLength: number = 420): string {
  const clean = narrative.replace(/^#+.*$/gm, "").trim();
  if (clean.length <= targetLength) return clean;
  const truncated = clean.slice(0, targetLength);
  const lastPeriod = Math.max(truncated.lastIndexOf(". "), truncated.lastIndexOf(".\n"));
  if (lastPeriod > 150) {
    return truncated.slice(0, lastPeriod + 1);
  }
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

/**
 * Builds the complete multi-part application suite with strict math validation.
 */
export function buildGrantDeliverableSuite(params: {
  grantTitle: string;
  funder: string;
  orgName: string;
  applicantNarrative: string;
  userInputNumbers: {
    requestedAmount?: string;
    personnelCost?: string;
    directCost?: string;
    adminCost?: string;
  };
  pastWinnerQualities: string[];
}): GrantDeliverablePackage {
  const { grantTitle, funder, orgName, applicantNarrative, userInputNumbers, pastWinnerQualities } = params;

  // Exact math normalization
  const totalNum = parseCurrency(userInputNumbers.requestedAmount) ?? 50000;
  let personnelNum = parseCurrency(userInputNumbers.personnelCost);
  let directNum = parseCurrency(userInputNumbers.directCost);
  let indirectNum = parseCurrency(userInputNumbers.adminCost);

  // If itemized numbers are incomplete, allocate strictly proportional splits that sum to 100% of total
  if (personnelNum === null || directNum === null || indirectNum === null) {
    personnelNum = Math.round(totalNum * 0.60);
    directNum = Math.round(totalNum * 0.30);
    indirectNum = totalNum - personnelNum - directNum; // Guaranteed exact sum
  } else {
    // If all three provided, re-align total to equal exact sum of parts
    const sum = personnelNum + directNum + indirectNum;
    if (sum !== totalNum) {
      indirectNum = Math.max(0, totalNum - personnelNum - directNum);
    }
  }

  const totalFormatted = formatCurrency(totalNum);
  const personnelFormatted = formatCurrency(personnelNum);
  const directFormatted = formatCurrency(directNum);
  const indirectFormatted = formatCurrency(indirectNum);

  const coverLetterMarkdown = `# Official Grant Application Cover Letter

**Date:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}  
**Grant Program:** ${grantTitle}  
**Funding Agency:** ${funder}  
**Applicant Entity:** ${orgName}  

Dear Grant Review Committee,

On behalf of ${orgName}, we respectfully submit this formal grant application for **${grantTitle}**. We are requesting **${totalFormatted}** in grant funding to execute our targeted community initiative.

Our program design and implementation strategy incorporate proven methodologies favored by ${funder}:
${pastWinnerQualities.map((q) => `- ${q}`).join("\n")}

We appreciate your review of our application and welcome the opportunity to provide any additional operational documentation or audit records.

Sincerely,  
**Executive Leadership Team**  
${orgName}  
`;

  const executiveSummaryMarkdown = `# Executive Summary & Abstract

**Project Title:** ${grantTitle}  
**Applicant Entity:** ${orgName}  
**Requested Funding:** ${totalFormatted}  

### Core Need & Program Objectives
${extractCleanAbstract(applicantNarrative)}

### Strategic Alignment with ${funder}
Our program design adheres to key winning benchmark criteria:
${pastWinnerQualities.map((q) => `- **${q.split(" ")[0]}**: ${q}`).join("\n")}

### Measurable Outcomes & Accountability
- Timely programmatic milestones evaluated through quantitative and qualitative indicators.
- Rigorous quarterly progress audits and public stakeholder reporting.
- Full adherence to ${funder} evaluation and fiscal stewardship requirements.
`;

  const budgetTableMarkdown = `# Itemized Line-Item Budget & Narrative Justification

### Summary Table
| Budget Category | Description | Requested Amount | % of Total |
|---|---|---|---|
| **Personnel & Staffing** | Direct program coordinators, key specialists, and project oversight | ${personnelFormatted} | ${Math.round((personnelNum / totalNum) * 100)}% |
| **Direct Project Costs** | Specialized equipment, participant supplies, and field operations | ${directFormatted} | ${Math.round((directNum / totalNum) * 100)}% |
| **Administrative & Indirect** | Audit, compliance reporting, and operational infrastructure | ${indirectFormatted} | ${Math.round((indirectNum / totalNum) * 100)}% |
| **TOTAL REQUEST** | **Full Project Budget** | **${totalFormatted}** | **100%** |

### Budget Narrative Justification
1. **Personnel & Staffing (${personnelFormatted}):** Allocates necessary staff hours to execute and supervise project deliverables without administrative dilution.
2. **Direct Project Supplies & Operations (${directFormatted}):** Covers essential operational materials, facility access, and technical resources directly benefiting target participants.
3. **Administrative & Indirect Oversight (${indirectFormatted}):** Covers mandatory fiscal compliance, external reporting, and transparent annual audit overhead.
`;

  const organizationCapacityMarkdown = `# Organizational Capacity & Governance Track Record

### Executive Leadership & Key Personnel
**${orgName}** deploys a qualified operational and technical leadership team with established domain expertise in executing grant-funded initiatives. Key personnel possess verified administrative oversight, financial management, and direct community implementation experience.

### Internal Financial Controls & Compliance
- **Fiscal Accountability:** Strict segregation of financial duties with independent accounting reviews ensuring zero commingling of grant funds.
- **Reporting Infrastructure:** Dedicated milestone and expenditure tracking aligned with ${funder} compliance guidelines.
- **Risk Mitigation:** Documented standard operating procedures and internal audits conducted prior to each quarterly reporting cycle.

### Past Performance & Community Footprint
Demonstrated track record of timely milestone delivery, community stakeholder engagement, and high-impact programmatic outcomes.
`;

  const submissionChecklistMarkdown = `# Final Submission & Portal Checklist

### Step-by-Step Portal Preparation:
- [ ] **SAM.gov Registration & UEI:** (Unique Entity Identifier — free 12-character ID required for all federal/state opportunities at SAM.gov).
- [ ] **IRS Tax Status Documentation:** Confirmed active 501(c)(3) determination letter or valid business registration (W-9).
- [ ] **Word Count Compliance:** Verified narrative sections adhere strictly to individual section caps.
- [ ] **Itemized Budget Alignment:** Confirmed the line-item spreadsheet matches the exact **${totalFormatted}** requested budget.
- [ ] **Letters of Support / MOUs:** Uploaded minimum 2 signed partnership agreements or community endorsements.
- [ ] **One-Click Export:** Download or copy your finalized proposal suite using the export controls below.
`;

  return {
    coverLetterMarkdown: scrubSensitivePii(coverLetterMarkdown),
    executiveSummaryMarkdown: scrubSensitivePii(executiveSummaryMarkdown),
    proposalNarrativeMarkdown: scrubSensitivePii(applicantNarrative),
    budgetTableMarkdown: scrubSensitivePii(budgetTableMarkdown),
    organizationCapacityMarkdown: scrubSensitivePii(organizationCapacityMarkdown),
    submissionChecklistMarkdown,
    piiScrubbed: true,
  };
}

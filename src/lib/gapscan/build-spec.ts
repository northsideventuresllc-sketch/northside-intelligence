import "server-only";
import { type CompetitorGapAudit } from "@/lib/gapscan/crawler";

export interface BuildSpecPackage {
  targetFeatureName: string;
  wedgeStrategy: string;
  markdownDoc: string;
  recommendedStack: string[];
  estimatedBuildTimeHours: number;
}

/**
 * Compiles identified competitor gaps into a ready-to-execute BUILD-SPEC.md for AI coding assistants.
 */
export function generateBuildSpec(params: {
  nicheSector: string;
  audits: CompetitorGapAudit[];
  targetAudience: string;
}): BuildSpecPackage {
  const { nicheSector, audits, targetAudience } = params;
  const primaryCompetitor = audits[0]?.domain || "Incumbent Tool";
  const featureName = `${nicheSector.replace(/[^a-zA-Z0-9]/g, "")} Wedge Solution`;

  const allGaps = audits.flatMap((a) => a.identifiedGaps).slice(0, 5);
  const allWeaknesses = audits.flatMap((a) => a.pricingWeaknesses).slice(0, 4);

  const markdownDoc = `# BUILD-SPEC.md — ${featureName}
> **Target Opportunity:** Counter-position against ${primaryCompetitor} in ${nicheSector}.  
> **Audience:** ${targetAudience}  
> **Prepared by:** Northside Intelligence GapScan Engine  

---

## 1. Executive Wedge Strategy
Competitors in this space are vulnerable due to heavy enterprise bloat, non-transparent pricing, and complete lack of agentic API/MCP extensibility:
${allGaps.map((g) => `- **Vulnerability:** ${g}`).join("\n")}
${allWeaknesses.map((w) => `- **Pricing Friction:** ${w}`).join("\n")}

**Our Strategic Wedge:** Build a fast, lightweight, AI-native alternative with transparent self-service pricing, instant time-to-value (<30 seconds), and first-class MCP server support for autonomous coding agents.

---

## 2. Technical Architecture & Recommended Stack
- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Compute Layer:** Vercel Edge / Serverless Functions with sub-second streaming
- **AI Routing:** Multi-model failover router (Gemini Flash → Claude Haiku → Local Ollama)
- **Database & Auth:** Supabase (PostgreSQL + Row-Level Security)
- **Integrations:** FastMCP Server (\`src/mcp/\`) exposing read/write tool primitives

---

## 3. Implementation Checklist for AI Coding Agent

### Phase 1: Core API & Engine (Hours 1–3)
- [ ] Create \`src/lib/engine.ts\` to handle the core domain logic without UI bloat.
- [ ] Implement rate-limiting and tier validation in \`src/app/api/v1/execute/route.ts\`.
- [ ] Wire multi-model router with zero-downtime error fallback.

### Phase 2: User Interface & Onboarding (Hours 4–6)
- [ ] Build single-screen, zero-friction input form with instant live preview.
- [ ] Implement local storage caching so user drafts are never lost on refresh.
- [ ] Add one-click export (JSON, Markdown, Webhook).

### Phase 3: Agentic Extensibility (Hours 7–8)
- [ ] Build \`src/mcp/server.ts\` exposing \`explore\`, \`generate\`, and \`verify\` tools.
- [ ] Author standard \`README.md\` and prompt instructions for Cursor & Claude Code.

---

## 4. Prompt for Coding Assistant
Copy and paste this into Cursor, Claude Code, or Antigravity:
\`\`\`
Build the MVP for ${featureName} described in BUILD-SPEC.md. Start with Phase 1 by creating the core engine and typed domain contracts in src/lib/engine.ts.
\`\`\`
`;

  return {
    targetFeatureName: featureName,
    wedgeStrategy: `Attack ${primaryCompetitor}'s opaque pricing and clunky UI by offering instant, self-service AI automation.`,
    markdownDoc,
    recommendedStack: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "FastMCP"],
    estimatedBuildTimeHours: 8,
  };
}

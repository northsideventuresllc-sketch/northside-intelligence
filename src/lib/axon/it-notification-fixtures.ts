import type { ItExecutiveSummary, ItReportMetrics, ItNotificationType } from './axon-types';

export const SAMPLE_EXECUTIVE_SUMMARY: ItExecutiveSummary = {
  title: 'ReplyFlow',
  description:
    'AI-powered inbox triage that drafts replies in your voice, prioritizes urgent threads, and learns from every edit you make.',
  targetAudience: 'Solopreneurs, coaches, and small sales teams (B2B + B2C)',
  subscriptionPriceUsd: 19,
  lifetimeOfferPriceUsd: 149,
  lifetimeOfferNote: 'Limited-time permanent purchase — 40% off through launch window',
  useCases: [
    'Triage a flooded inbox in under 5 minutes',
    'Draft follow-ups that match your tone',
    'Flag high-intent leads before they go cold',
  ],
  estimatedRevenueEoyUsd: 4200,
  revenueAssumptions: '120 paying subs @ $19/mo by Dec; 15% annual upsell',
  marketingStrategy:
    'Content-led launch: 3 pillar posts/week, LinkedIn founder story, micro-influencer DM swaps, free 7-day trial with onboarding checklist.',
  rolloutPlan:
    'Week 1: waitlist + beta cohort. Week 2: public preview on NI Portal. Week 3: paid tiers live. Week 4: retarget churned trial users.',
  competitors: ['Superhuman', 'Fixer', 'Lavender'],
  differentiation:
    'Neurodivergent-friendly UX, NI toolkit integration, and AXON memory that adapts to how you actually write — not generic templates.',
  previewUrl: 'https://replyflow-preview.vercel.app',
};

export const SAMPLE_REPORT_METRICS: ItReportMetrics = {
  reportType: 'ninety_day',
  toolSlug: 'replyflow',
  toolName: 'ReplyFlow',
  periodDays: 90,
  signups: 842,
  activeUsers: 312,
  payingUsers: 118,
  mrrUsd: 2242,
  churnPct: 4.2,
  usageEvents: 18420,
  topFeatures: ['Smart draft', 'Priority inbox', 'Follow-up queue'],
  aiRecommendation: 'keep',
  rationale:
    'MRR grew 38% over the period with healthy activation. Churn is below sector median. Recommend KEEP and lock for 365 days.',
};

export const SAMPLE_ARCHIVE_REVIVAL: ItReportMetrics = {
  ...SAMPLE_REPORT_METRICS,
  reportType: 'archive_revival',
  toolSlug: 'creatorrx',
  toolName: 'Content Creator Rx',
  aiRecommendation: 'keep',
  rationale:
    'Creator economy tooling demand up 22% YoY. Archived metrics show strong trial-to-paid on coach segment. Worth a 30-day revival trial.',
};

export type ItTestFixtureKey = 'it_launch' | 'it_90_day' | 'archive_revival' | 'outreach_draft';

export function buildItTestNotification(
  fixture: ItTestFixtureKey
): Omit<
  import('./axon-types').AxonNotification,
  'id' | 'read' | 'created_at' | 'read_at' | 'archived' | 'archived_at' | 'resolved' | 'declined'
> {
  const base = {
    source: 'ARM3 Pipeline',
    urgent: false,
    isTest: true as const,
  };

  switch (fixture) {
    case 'it_launch':
      return {
        ...base,
        itType: 'it_launch' as ItNotificationType,
        title: `IT Launch Review: ${SAMPLE_EXECUTIVE_SUMMARY.title}`,
        body: 'New Sector 3 IT ready for preview review. Approve to go live on NI Portal.',
        itPayload: {
          launchId: 'test-launch-1',
          opportunityId: 0,
          toolSlug: 'replyflow',
          summary: SAMPLE_EXECUTIVE_SUMMARY,
        },
        links: [{ label: 'Open Preview', url: SAMPLE_EXECUTIVE_SUMMARY.previewUrl }],
      };
    case 'it_90_day':
      return {
        ...base,
        itType: 'it_report' as ItNotificationType,
        title: `90-Day IT Report: ${SAMPLE_REPORT_METRICS.toolName}`,
        body: SAMPLE_REPORT_METRICS.rationale,
        itPayload: {
          reportId: 'test-report-1',
          metrics: SAMPLE_REPORT_METRICS,
        },
      };
    case 'archive_revival':
      return {
        ...base,
        itType: 'it_report' as ItNotificationType,
        title: `Archive Revival Candidate: ${SAMPLE_ARCHIVE_REVIVAL.toolName}`,
        body: SAMPLE_ARCHIVE_REVIVAL.rationale,
        itPayload: {
          reportId: 'test-revival-1',
          metrics: SAMPLE_ARCHIVE_REVIVAL,
        },
      };
    case 'outreach_draft':
      return {
        source: 'NI Outreach',
        title: 'New Draft Ready For Review',
        body: 'A new outreach draft was generated for your queue.',
        urgent: false,
        isTest: true,
        links: [{ label: 'Open Queue', url: '/tools/ni-outreach' }],
      };
    default:
      return {
        ...base,
        title: 'Test Notification',
        body: 'Fixture not found.',
      };
  }
}

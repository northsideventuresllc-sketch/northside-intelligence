import { ReviewArtifacts } from "@/components/ops/ReviewArtifacts";
import { listReviewArtifacts } from "@/lib/ops/review-artifacts";

export const dynamic = "force-dynamic";

export default async function OpsArtifactsPage() {
  const artifacts = await listReviewArtifacts();

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <header className="mb-8 border-b border-white/10 pb-6">
        <h1 className="text-2xl font-semibold text-white">Review Artifacts</h1>
        <p className="mt-1 text-sm text-ni-muted">
          Operator review queue (Decision #1888) — outreach and content drafts wait here until
          approved. Nothing sends, posts, or publishes without a decision made on this page.
        </p>
      </header>
      <ReviewArtifacts initialArtifacts={artifacts} />
    </main>
  );
}

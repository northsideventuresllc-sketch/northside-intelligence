import { ReviewArtifacts } from "@/components/ops/ReviewArtifacts";
import { listArtifacts } from "@/lib/ops/review-artifacts";

export const dynamic = "force-dynamic";

export default async function OpsArtifactsPage() {
  const artifacts = await listArtifacts();

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <header className="mb-8 border-b border-white/10 pb-6">
        <h1 className="text-2xl font-semibold text-white">Review Artifacts</h1>
        <p className="mt-1 text-sm text-ni-muted">
          Universal Operator Review pipeline (Decision #1888) — outreach and content drafts
          awaiting approve / reject / needs-changes before anything sends.
        </p>
      </header>
      <ReviewArtifacts initialArtifacts={artifacts} />
    </main>
  );
}

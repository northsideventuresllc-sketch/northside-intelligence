import { ReviewArtifactsList } from '@/components/axon-ui/review-artifacts-list';
import { listPendingReviewArtifacts } from '@/lib/axon/reviewArtifacts';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';

export const dynamic = 'force-dynamic';

export default async function AxonReviewArtifactsPage({
  params,
}: {
  params: { username: string };
}) {
  await requireAxonPortalUser(params.username);
  const items = await listPendingReviewArtifacts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-axon-text">Review Queue</h1>
        <p className="mt-1 text-sm text-axon-muted">
          Drafts waiting on your approval before they go out — outreach messages and social
          posts, across every venture.
        </p>
      </div>
      <ReviewArtifactsList items={items} />
    </div>
  );
}

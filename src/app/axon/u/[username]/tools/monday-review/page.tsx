import { MondayReviewTool } from '@/components/axon-ui/monday-review-tool';
import { fetchMondayReview } from '@/lib/axon/monday-review';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';

export const dynamic = 'force-dynamic';

export default async function AxonMondayReviewPage({
  params,
}: {
  params: { username: string };
}) {
  await requireAxonPortalUser(params.username);
  const { approvable, needsCleanup } = await fetchMondayReview();
  return <MondayReviewTool approvable={approvable} needsCleanup={needsCleanup} />;
}

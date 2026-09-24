import { RedditMachineTool } from '@/components/axon-ui/reddit-machine-tool';
import { listOpportunities } from '@/lib/axon/reddit-machine';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';

export const dynamic = 'force-dynamic';

export default async function AxonRedditPage(props: { params: Promise<{ username: string }> }) {
  const params = await props.params;
  await requireAxonPortalUser(params.username);
  const initial = await listOpportunities().catch(() => []);
  return <RedditMachineTool initial={initial} />;
}

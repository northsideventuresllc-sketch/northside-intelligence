import { BrainGalaxyTool } from '@/components/axon-ui/brain-galaxy-tool';
import { loadBrainGraph } from '@/lib/axon/brain-graph';
import { axonPublicPath } from '@/lib/axon/paths';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';

export const dynamic = 'force-dynamic';

export default async function AxonBrainPage({ params }: { params: { username: string } }) {
  const { username } = await requireAxonPortalUser(params.username);
  const clusters = await loadBrainGraph().catch(() => []);
  return <BrainGalaxyTool clusters={clusters} basePath={axonPublicPath(username)} />;
}

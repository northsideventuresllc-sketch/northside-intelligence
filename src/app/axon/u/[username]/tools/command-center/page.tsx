import { CommandCenterTool } from '@/components/axon-ui/command-center-tool';
import { loadCommandCenter } from '@/lib/axon/command-center';
import { axonPublicPath } from '@/lib/axon/paths';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';

export const dynamic = 'force-dynamic';

export default async function AxonCommandCenterPage(
  props: {
    params: Promise<{ username: string }>;
  }
) {
  const params = await props.params;
  const { username } = await requireAxonPortalUser(params.username);
  const data = await loadCommandCenter();
  return <CommandCenterTool data={data} basePath={axonPublicPath(username)} />;
}

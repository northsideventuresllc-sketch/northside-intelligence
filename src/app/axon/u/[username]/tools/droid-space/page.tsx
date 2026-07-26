import { DroidSpaceTool } from '@/components/axon-ui/droid-space-tool';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';

export const dynamic = 'force-dynamic';

export default async function AxonDroidSpacePage({
  params,
}: {
  params: { username: string };
}) {
  await requireAxonPortalUser(params.username);
  return <DroidSpaceTool />;
}

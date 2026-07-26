import { LucielleTool } from '@/components/axon-ui/lucielle-tool';
import { emptySnapshot } from '@/lib/axon/lucielle';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';

export const dynamic = 'force-dynamic';

export default async function AxonLuciellePage({
  params,
}: {
  params: { username: string };
}) {
  await requireAxonPortalUser(params.username);
  return <LucielleTool business={emptySnapshot('business')} personal={emptySnapshot('personal')} />;
}

import { UsageTowerTool } from '@/components/axon-ui/usage-tower-tool';
import { loadUsageTower } from '@/lib/axon/usage-tower';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';

export const dynamic = 'force-dynamic';

export default async function AxonUsageTowerPage({
  params,
}: {
  params: { username: string };
}) {
  await requireAxonPortalUser(params.username);
  const initial = await loadUsageTower().catch(() => ({
    days: [],
    providers: [],
    brakes: [],
    totalSpendUsd: 0,
    paidJobs: 0,
    localJobs: 0,
  }));
  return <UsageTowerTool initial={initial} />;
}

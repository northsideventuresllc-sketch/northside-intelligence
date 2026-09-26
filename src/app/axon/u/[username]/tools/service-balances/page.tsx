import { ServiceBalancesPanel } from '@/components/axon-ui/service-balances-panel';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';

export const dynamic = 'force-dynamic';

export default async function AxonServiceBalancesPage({ params }: { params: { username: string } }) {
  await requireAxonPortalUser(params.username);

  return (
    <div className="p-6">
      <ServiceBalancesPanel />
    </div>
  );
}

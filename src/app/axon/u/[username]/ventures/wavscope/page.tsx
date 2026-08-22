import { WavScopeVentureHub } from '@/components/axon-ui/wavscope-venture-hub';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';

export const dynamic = 'force-dynamic';

export default async function AxonWavScopeVenturePage({ params }: { params: { username: string } }) {
  await requireAxonPortalUser(params.username);
  return <WavScopeVentureHub />;
}

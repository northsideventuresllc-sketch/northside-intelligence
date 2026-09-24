import { WavScopeVentureHub } from '@/components/axon-ui/wavscope-venture-hub';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';

export const dynamic = 'force-dynamic';

export default async function AxonWavScopeVenturePage(props: { params: Promise<{ username: string }> }) {
  const params = await props.params;
  await requireAxonPortalUser(params.username);
  return <WavScopeVentureHub />;
}

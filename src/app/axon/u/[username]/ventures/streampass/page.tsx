import { StreamPassVentureHub } from '@/components/axon-ui/streampass-venture-hub';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';

export const dynamic = 'force-dynamic';

export default async function AxonStreamPassVenturePage(props: { params: Promise<{ username: string }> }) {
  const params = await props.params;
  await requireAxonPortalUser(params.username);
  return <StreamPassVentureHub />;
}

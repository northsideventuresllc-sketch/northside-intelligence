import { redirect } from 'next/navigation';
import { axonPublicPath } from '@/lib/axon/paths';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';

export const dynamic = 'force-dynamic';

/** Droid Space merged into Command Center (JB decision 2026-07-26, #335). */
export default async function AxonDroidSpaceRedirect({
  params,
}: {
  params: { username: string };
}) {
  const { username } = await requireAxonPortalUser(params.username);
  redirect(`${axonPublicPath(username)}/tools/command-center`);
}

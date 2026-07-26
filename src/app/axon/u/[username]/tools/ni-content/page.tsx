import { NiContentEngineTool } from '@/components/axon-ui/ni-content-engine-tool';
import { listNiPosts } from '@/lib/content-machine/ni-content';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';

export const dynamic = 'force-dynamic';

export default async function AxonNiContentPage({
  params,
}: {
  params: { username: string };
}) {
  await requireAxonPortalUser(params.username);
  const posts = await listNiPosts().catch(() => []);
  return <NiContentEngineTool initialPosts={posts} />;
}

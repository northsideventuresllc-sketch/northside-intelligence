import { ArchivedItsPanel } from '@/components/axon-ui/archived-its-panel';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ArchivedItsPage({ params }: { params: { username: string } }) {
  await requireAxonPortalUser(params.username);

  const supabase = createServiceClient();
  const { data: rows, error } = await supabase
    .from('arm3_archived_tools')
    .select('id, tool_slug, name, description, removed_at, revival_eligible, revival_score')
    .order('removed_at', { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-300">Failed to load archived ITs: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-axon-muted">
        Master Only
      </p>
      <h1 className="text-2xl font-semibold text-white">Archived ITs</h1>
      <p className="mt-2 max-w-xl text-sm text-axon-muted">
        Revive archived intelligence tools for a 30- or 90-day trial. Only master accounts can
        access this vault.
      </p>
      <div className="mt-8">
        <ArchivedItsPanel initialRows={rows ?? []} />
      </div>
    </div>
  );
}

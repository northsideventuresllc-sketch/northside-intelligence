import { MoralityAmendments } from "@/components/ops/MoralityAmendments";
import { listAmendments, listStewards } from "@/lib/ops/morality";

export const dynamic = "force-dynamic";

export default async function OpsMoralityPage() {
  const [amendments, stewards] = await Promise.all([listAmendments(), listStewards()]);

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <header className="mb-8 border-b border-white/10 pb-6">
        <h1 className="text-2xl font-semibold text-white">Morality Amendments</h1>
        <p className="mt-1 text-sm text-ni-muted">
          Steward review — pending proposals, vote, chair veto, ratify. Non-impairment invariant.
        </p>
      </header>
      <MoralityAmendments initialAmendments={amendments} stewards={stewards} />
    </main>
  );
}

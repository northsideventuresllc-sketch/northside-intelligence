import { Sector3ToolsTable } from "@/components/ops/Sector3ToolsTable";
import { MatchFitSnapshot } from "@/components/ops/MatchFitSnapshot";
import { RevenueTracker } from "@/components/ops/RevenueTracker";
import { QuickLinks } from "@/components/ops/QuickLinks";

export default function OpsDashboardPage() {
  return (
    <main className="flex-1 overflow-y-auto p-8">
      <header className="mb-8 border-b border-white/10 pb-6">
        <h1 className="text-2xl font-semibold text-white">Operations Dashboard</h1>
        <p className="mt-1 text-sm text-ni-muted">JB-only internal panel</p>
      </header>
      <div className="space-y-10">
        <Sector3ToolsTable />
        <MatchFitSnapshot />
        <RevenueTracker />
        <QuickLinks />
      </div>
    </main>
  );
}

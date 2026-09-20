import { TrustDashboard } from "@/components/ops/TrustDashboard";

export default function OpsTrustPage() {
  return (
    <main className="flex-1 overflow-y-auto p-8">
      <header className="mb-8 border-b border-white/10 pb-6">
        <h1 className="text-2xl font-semibold text-white">Trust & Morality</h1>
        <p className="mt-1 text-sm text-ni-muted">
          Morality pin status, recent denials, and Global Morality Halt state
        </p>
      </header>
      <TrustDashboard />
    </main>
  );
}

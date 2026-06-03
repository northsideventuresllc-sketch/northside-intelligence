import { OpsSidebar } from "@/components/ops/OpsSidebar";

export default function OpsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-ni-bg">
      <OpsSidebar />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

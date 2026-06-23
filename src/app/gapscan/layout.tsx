import { Sector3BackToHome } from "@/components/sector3/Sector3BackToHome";
import { GAPSCAN_CONFIG } from "@/lib/sector3-tools/configs";
import { sector3ToolMetadata, Sector3ToolLayoutShell } from "@/lib/sector3-tools/layout-shell";

export const metadata = sector3ToolMetadata(
  GAPSCAN_CONFIG,
  "Automated workflow gap detection — find friction, whitespace, and missing steps."
);

export default function GapScanLayout({ children }: { children: React.ReactNode }) {
  return (
    <Sector3ToolLayoutShell>
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <Sector3BackToHome variant="portal" />
      </div>
    </Sector3ToolLayoutShell>
  );
}

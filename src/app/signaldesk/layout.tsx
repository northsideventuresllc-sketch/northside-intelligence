import { Sector3BackToHome } from "@/components/sector3/Sector3BackToHome";
import { SIGNALDESK_CONFIG } from "@/lib/sector3-tools/configs";
import { sector3ToolMetadata, Sector3ToolLayoutShell } from "@/lib/sector3-tools/layout-shell";

export const metadata = sector3ToolMetadata(
  SIGNALDESK_CONFIG,
  "Unified intelligence signals hub — prioritize what matters from raw market and competitive input."
);

export default function SignalDeskLayout({ children }: { children: React.ReactNode }) {
  return (
    <Sector3ToolLayoutShell>
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <Sector3BackToHome variant="portal" />
      </div>
    </Sector3ToolLayoutShell>
  );
}

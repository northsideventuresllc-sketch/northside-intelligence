import { StoreAssistantWidget } from "@/components/store/StoreAssistantWidget";
import { StoreCartProvider } from "@/components/store/StoreCartProvider";
import { StoreFloatingCartBar } from "@/components/store/StoreFloatingCartBar";
import { StoreGateProvider } from "@/components/store/StoreGateProvider";
import { ensureStoreEnv } from "@/lib/store/env";
import { getStoreGateStatus } from "@/lib/store/gate";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  await ensureStoreEnv();
  const gate = getStoreGateStatus();

  return (
    <StoreGateProvider gate={gate}>
      <StoreCartProvider>
        {children}
        <StoreFloatingCartBar />
        <StoreAssistantWidget />
      </StoreCartProvider>
    </StoreGateProvider>
  );
}

import { StoreAssistantWidget } from "@/components/store/StoreAssistantWidget";
import { StoreCartProvider } from "@/components/store/StoreCartProvider";
import { StoreFloatingCartBar } from "@/components/store/StoreFloatingCartBar";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreCartProvider>
      {children}
      <StoreFloatingCartBar />
      <StoreAssistantWidget />
    </StoreCartProvider>
  );
}

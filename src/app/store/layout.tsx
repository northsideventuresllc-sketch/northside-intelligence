import { StoreAssistantWidget } from "@/components/store/StoreAssistantWidget";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <StoreAssistantWidget />
    </>
  );
}

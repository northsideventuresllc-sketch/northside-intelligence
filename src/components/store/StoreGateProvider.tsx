"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { StoreGateStatus } from "@/lib/store/types";

const StoreGateContext = createContext<StoreGateStatus | null>(null);

export function StoreGateProvider({
  gate,
  children,
}: {
  gate: StoreGateStatus;
  children: ReactNode;
}) {
  return <StoreGateContext.Provider value={gate}>{children}</StoreGateContext.Provider>;
}

export function useStoreGate(): StoreGateStatus {
  const gate = useContext(StoreGateContext);
  if (!gate) {
    throw new Error("useStoreGate must be used within StoreGateProvider");
  }
  return gate;
}

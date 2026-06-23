import { redirect } from "next/navigation";
import { createSector3ToolAuth } from "@/lib/sector3-tools/auth";
import { GAPSCAN_CONFIG } from "@/lib/sector3-tools/configs";

const auth = createSector3ToolAuth(GAPSCAN_CONFIG);

export default function GapScanLoginPage() {
  redirect(auth.portalSignInUrl());
}

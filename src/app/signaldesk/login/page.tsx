import { redirect } from "next/navigation";
import { createSector3ToolAuth } from "@/lib/sector3-tools/auth";
import { SIGNALDESK_CONFIG } from "@/lib/sector3-tools/configs";

const auth = createSector3ToolAuth(SIGNALDESK_CONFIG);

export default function SignalDeskLoginPage() {
  redirect(auth.portalSignInUrl());
}

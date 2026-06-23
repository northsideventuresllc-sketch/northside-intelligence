import { redirect } from "next/navigation";
import { createSector3ToolAuth } from "@/lib/sector3-tools/auth";
import { BRIDGEAI_CONFIG } from "@/lib/sector3-tools/configs";

const auth = createSector3ToolAuth(BRIDGEAI_CONFIG);

export default function BridgeAISignupPage() {
  redirect(auth.portalSignUpUrl());
}

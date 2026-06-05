import { redirect } from "next/navigation";
import { portalSignInUrl } from "@/lib/replyflow/auth";

export default function ReplyFlowLoginPage() {
  redirect(portalSignInUrl());
}

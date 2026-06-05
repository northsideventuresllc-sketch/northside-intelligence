import { redirect } from "next/navigation";
import { portalSignUpUrl } from "@/lib/replyflow/auth";

export default function ReplyFlowSignupPage() {
  redirect(portalSignUpUrl());
}

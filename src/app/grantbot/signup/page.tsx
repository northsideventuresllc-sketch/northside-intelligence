import { redirect } from "next/navigation";
import { portalSignUpUrl } from "@/lib/grantbot/auth";

export default function GrantBotSignupPage() {
  redirect(portalSignUpUrl());
}

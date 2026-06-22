import { redirect } from "next/navigation";
import { portalSignInUrl } from "@/lib/grantbot/auth";

export default function GrantBotLoginPage() {
  redirect(portalSignInUrl());
}

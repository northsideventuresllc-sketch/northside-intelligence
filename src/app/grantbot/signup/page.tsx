import { redirect } from "next/navigation";

export default async function GrantBotSignupPage() {
  const query = new URLSearchParams({
    returnTo: "/grantbot/dashboard",
    tool: "grantbot",
  });
  redirect(`/auth/signup?${query.toString()}`);
}

import { redirect } from "next/navigation";

export default async function GrantBotSignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string; trial?: string; trial_code?: string; trialCode?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const code = params?.code || params?.trial || params?.trial_code || params?.trialCode;
  const query = new URLSearchParams({
    returnTo: "/grantbot/dashboard",
    tool: "grantbot",
  });
  if (code) query.set("code", code);
  redirect(`/auth/signup?${query.toString()}`);
}

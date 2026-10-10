import { redirect } from "next/navigation";

export default async function GapScanSignupPage() {
  const query = new URLSearchParams({
    returnTo: "/gapscan/dashboard",
    tool: "gapscan",
  });
  redirect(`/auth/signup?${query.toString()}`);
}

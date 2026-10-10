import { redirect } from "next/navigation";

export default async function SignalDeskSignupPage() {
  const query = new URLSearchParams({
    returnTo: "/signaldesk/dashboard",
    tool: "signaldesk",
  });
  redirect(`/auth/signup?${query.toString()}`);
}

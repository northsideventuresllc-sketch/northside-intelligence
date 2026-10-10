import { redirect } from "next/navigation";

export default async function BridgeAISignupPage() {
  const query = new URLSearchParams({
    returnTo: "/bridgeai/dashboard",
    tool: "bridgeai",
  });
  redirect(`/auth/signup?${query.toString()}`);
}

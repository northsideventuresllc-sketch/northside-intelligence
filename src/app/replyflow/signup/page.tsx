import { redirect } from "next/navigation";

export default async function ReplyFlowSignupPage() {
  const query = new URLSearchParams({
    returnTo: "/replyflow/dashboard",
    tool: "replyflow",
  });
  redirect(`/auth/signup?${query.toString()}`);
}

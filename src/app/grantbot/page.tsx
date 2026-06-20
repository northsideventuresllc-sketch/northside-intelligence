import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export default async function GrantBotHome() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/grantbot/dashboard" : "/tools/grantbot");
}

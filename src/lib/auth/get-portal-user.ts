import { createServerAuthClient } from "@/lib/supabase/server-auth";

export type PortalUser = {
  id: string;
  email: string;
  fullName: string | null;
};

export async function getPortalUser(): Promise<PortalUser | null> {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: profile } = await supabase
    .from("ni_portal_profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: profile?.email ?? user.email,
    fullName: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null,
  };
}

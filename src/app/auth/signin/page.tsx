import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { resolvePostAuthRedirect } from "@/lib/ni-auth";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

/**
 * Logged-in users who land on /auth/signin go straight back to where they
 * came from instead of seeing the sign-in form again.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(resolvePostAuthRedirect(params?.returnTo));
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-ni-bg" />}>
      <AuthForm mode="signin" />
    </Suspense>
  );
}

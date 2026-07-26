import { NextRequest, NextResponse } from "next/server";
import { canEnterAxonPortal, ensureMasterAxonAccess } from "@/lib/axon/access";
import { axonPublicPath } from "@/lib/axon/paths";
import { setAxonSessionCookie } from "@/lib/axon/session";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";

/** Establishes an AXON session for the master account and opens the portal. */
export async function GET(request: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("next", "/axon");
    return NextResponse.redirect(signInUrl);
  }

  const canEnter = await canEnterAxonPortal(user.id);
  if (!canEnter) {
    return NextResponse.redirect(new URL("/axon", request.url));
  }

  const username = request.nextUrl.searchParams.get("username")?.trim().toLowerCase();
  if (!username) {
    return NextResponse.redirect(new URL("/axon", request.url));
  }

  const { data: profile } = await supabase
    .from("ni_portal_profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  const portalUsername = profile?.username?.trim().toLowerCase() ?? "";
  if (portalUsername !== username) {
    return NextResponse.redirect(new URL("/toolkit", request.url));
  }

  await ensureMasterAxonAccess(user.id);

  const response = NextResponse.redirect(
    new URL(axonPublicPath(username, "/dashboard"), request.url)
  );

  // If the signing secret is missing, minting throws and the browser gets a
  // 500 with no body — indistinguishable from the black screen this flow used
  // to produce. Fail loudly and in plain English instead.
  try {
    setAxonSessionCookie(response, user.id);
  } catch {
    return NextResponse.json(
      {
        error:
          "AXON cannot start a session because its session secret is not configured on the server.",
      },
      { status: 500 }
    );
  }

  return response;
}

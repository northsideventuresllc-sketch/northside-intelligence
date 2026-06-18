import { portalHomeUrl } from "@/lib/ni-auth";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function BackToNiPortalHome() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const href = portalHomeUrl(!!user);

  return (
    <div className="relative z-10 border-t border-white/10 py-8 text-center">
      <a
        href={href}
        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/80 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
      >
        ← Back to Home
      </a>
    </div>
  );
}

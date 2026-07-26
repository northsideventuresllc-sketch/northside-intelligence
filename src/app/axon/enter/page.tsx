import type { Metadata } from "next";
import { AxonEnterRedirect } from "@/components/axon/AxonEnterRedirect";

export const metadata: Metadata = {
  title: "Opening AXON…",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Session hand-off page (fixes the AXON dashboard black screen).
 *
 * The portal guard used to `redirect()` straight to /api/axon/bootstrap. On a
 * client-side navigation the Next router fetches an RSC payload, and an API
 * route does not return one — so the router rendered nothing and JB got a black
 * screen until he hard-refreshed. This page IS a real route, so the router can
 * render it, and it then does a full browser navigation to the bootstrap
 * endpoint, which sets the session cookie and forwards to the dashboard.
 */
export default async function AxonEnterPage({
  searchParams,
}: {
  searchParams: { username?: string };
}) {
  const username = (searchParams.username ?? "").trim().toLowerCase();
  const target = `/api/axon/bootstrap?username=${encodeURIComponent(username)}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050b16] px-6 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#60a5fa]">
          Northside Intelligence
        </p>
        <h1 className="mt-3 text-2xl font-bold text-white">Opening AXON…</h1>
        <p className="mt-2 text-sm text-[#7a8fa8]">One moment while your session starts.</p>
        <noscript>
          <p className="mt-4 text-sm text-white">
            <a href={target} className="underline">
              Continue to AXON
            </a>
          </p>
        </noscript>
      </div>
      <AxonEnterRedirect target={target} />
    </main>
  );
}

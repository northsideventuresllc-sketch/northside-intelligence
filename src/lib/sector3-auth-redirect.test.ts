import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({ user: null as null | { id: string } }));

// Stub only createServerAuthClient (the real one reads cookies() from next/headers).
vi.mock("@/lib/supabase/server-auth", () => ({
  createServerAuthClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
  }),
}));

// next/navigation redirect() throws a NEXT_REDIRECT error carrying the target.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT;replace;${url};307;`, url });
  },
}));

import { redirectLoggedInSector3ToDashboard } from "./sector3-auth-redirect";
import { getSector3Route } from "./sector3-routing";

const ITS = ["grantbot", "gapscan", "signaldesk", "bridgeai", "replyflow"] as const;

async function caught(fn: () => Promise<unknown>): Promise<{ url: string; digest: string } | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    return e as { url: string; digest: string };
  }
}

describe("registry: all five IT tools are LIVE with the expected paths", () => {
  it.each(ITS)("%s", (slug) => {
    const route = getSector3Route(slug);
    expect(route).not.toBeNull();
    expect(route!.status).toBe("LIVE");
    expect(route!.landingPath).toBe(`/${slug}`);
    expect(route!.dashboardPath).toBe(`/${slug}/dashboard`);
  });
});

describe("redirectLoggedInSector3ToDashboard (real helper, stubbed auth client)", () => {
  beforeEach(() => {
    state.user = null;
  });

  it.each(ITS)("logged-in user on /%s is redirected to its literal dashboard path", async (slug) => {
    state.user = { id: "u1" };
    const err = await caught(() => redirectLoggedInSector3ToDashboard(`/${slug}`));
    expect(err, "expected a NEXT_REDIRECT throw").not.toBeNull();
    expect(err!.url).toBe(`/${slug}/dashboard`);
    expect(err!.digest).toBe(`NEXT_REDIRECT;replace;/${slug}/dashboard;307;`);
  });

  it.each(ITS)("logged-out visitor on /%s is not redirected", async (slug) => {
    state.user = null;
    await expect(redirectLoggedInSector3ToDashboard(`/${slug}`)).resolves.toBeUndefined();
  });

  it("trailing slash still redirects; an unknown path never does", async () => {
    state.user = { id: "u1" };
    expect((await caught(() => redirectLoggedInSector3ToDashboard("/grantbot/")))?.url).toBe("/grantbot/dashboard");
    expect(await caught(() => redirectLoggedInSector3ToDashboard("/not-an-it"))).toBeNull();
  });
});

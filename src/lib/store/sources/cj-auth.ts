import "server-only";

const CJ_AUTH_URL =
  "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken";

let cached: { token: string; expiresAt: number } | null = null;

/** Exchange CJ API key for a short-lived access token. */
export async function getCjAccessToken(): Promise<string | null> {
  const apiKey = process.env.CJ_DROPSHIPPING_API_KEY?.trim();
  if (!apiKey) return null;

  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  try {
    const res = await fetch(CJ_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("[store/cj] auth failed:", res.status);
      return null;
    }

    const json = (await res.json()) as {
      result?: boolean;
      data?: { accessToken?: string; accessTokenExpiryDate?: string };
    };

    const token = json.data?.accessToken?.trim();
    if (!token) return null;

    const expiry = json.data?.accessTokenExpiryDate
      ? new Date(json.data.accessTokenExpiryDate).getTime()
      : Date.now() + 12 * 60 * 60 * 1000;

    cached = { token, expiresAt: expiry - 60_000 };
    return token;
  } catch (err) {
    console.warn("[store/cj] auth error:", err);
    return null;
  }
}

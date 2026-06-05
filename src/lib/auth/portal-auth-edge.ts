type EdgeAction = "issue-otp" | "create-pending" | "verify";

interface EdgeResponse<T> {
  ok: boolean;
  status: number;
  data: T;
}

function getEdgeConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const gateway = process.env.NI_AUTH_GATEWAY_SECRET;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!gateway) {
    throw new Error("Missing NI_AUTH_GATEWAY_SECRET");
  }

  return {
    url: `${supabaseUrl}/functions/v1/ni-portal-auth`,
    gateway,
  };
}

async function callPortalAuthEdge<T>(
  action: EdgeAction,
  payload: Record<string, unknown>
): Promise<EdgeResponse<T>> {
  const { url, gateway } = getEdgeConfig();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ni-auth-gateway": gateway,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export async function issueOtpViaEdge({
  email,
  purpose,
  metadata = {},
}: {
  email: string;
  purpose: "signup" | "signin";
  metadata?: Record<string, unknown>;
}) {
  const result = await callPortalAuthEdge<{ expiresAt?: string; error?: string }>(
    "issue-otp",
    { email, purpose, metadata }
  );

  if (!result.ok) {
    throw new Error(result.data.error ?? "Failed to send verification email");
  }

  return { expiresAt: result.data.expiresAt };
}

export async function createPendingViaEdge({
  email,
  password,
  flow,
  fullName,
  returnTo,
  metadata = {},
}: {
  email: string;
  password: string;
  flow: "signup" | "signin";
  fullName?: string | null;
  returnTo?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const result = await callPortalAuthEdge<{ pendingId?: string; error?: string }>(
    "create-pending",
    { email, password, flow, fullName, returnTo, metadata }
  );

  if (!result.ok || !result.data.pendingId) {
    throw new Error(result.data.error ?? "Failed to start verification");
  }

  return { pendingId: result.data.pendingId };
}

export async function verifyViaEdge({
  pendingId,
  code,
}: {
  pendingId: string;
  code: string;
}) {
  return callPortalAuthEdge<{
    success?: boolean;
    returnTo?: string | null;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }>("verify", { pendingId, code });
}

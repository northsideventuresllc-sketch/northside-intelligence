type ReplyFlowAction = "generate" | "checkout" | "stripe-webhook";

interface EdgeResponse<T> {
  ok: boolean;
  status: number;
  data: T;
}

function getEdgeConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const gateway =
    process.env.NI_REPLYFLOW_GATEWAY_SECRET ?? process.env.NI_AUTH_GATEWAY_SECRET;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!gateway) {
    throw new Error("Missing NI_REPLYFLOW_GATEWAY_SECRET");
  }

  return {
    url: `${supabaseUrl}/functions/v1/ni-replyflow`,
    gateway,
  };
}

export async function callReplyFlowEdge<T>(
  action: ReplyFlowAction,
  payload: Record<string, unknown>,
  options?: { accessToken?: string; rawBody?: string; stripeSignature?: string | null }
): Promise<EdgeResponse<T>> {
  const { url, gateway } = getEdgeConfig();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-ni-replyflow-gateway": gateway,
  };

  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  if (action === "stripe-webhook" && options?.rawBody !== undefined) {
    headers["Content-Type"] = "text/plain";
    if (options.stripeSignature) {
      headers["stripe-signature"] = options.stripeSignature;
    }
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: options.rawBody,
    });
    const data = (await res.json().catch(() => ({}))) as T;
    return { ok: res.ok, status: res.status, data };
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ action, ...payload }),
  });

  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

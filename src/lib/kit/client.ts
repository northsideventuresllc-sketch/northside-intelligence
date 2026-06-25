import "server-only";

const KIT_V3_API_BASE = "https://api.convertkit.com/v3";
const KIT_V4_API_BASE = "https://api.kit.com/v4";

export interface KitSubscriber {
  id: number;
  email_address: string;
  first_name: string | null;
  state: string;
}

interface KitV3Config {
  apiKey: string;
  apiSecret: string;
  formId: string;
}

interface KitV4Config {
  apiKey: string;
  formId: string;
}

function getKitV3Config(): KitV3Config | null {
  const apiKey = process.env.KIT_API_KEY?.trim();
  const apiSecret = process.env.KIT_API_SECRET?.trim();
  const formId = process.env.KIT_FORM_ID?.trim();
  if (!apiKey || !apiSecret || !formId) return null;
  return { apiKey, apiSecret, formId };
}

function getKitV4Config(): KitV4Config | null {
  const apiKey = process.env.KIT_API_KEY?.trim();
  const formId = process.env.KIT_FORM_ID?.trim();
  if (!apiKey || !formId) return null;
  if (process.env.KIT_API_SECRET?.trim()) return null;
  return { apiKey, formId };
}

export function isKitConfigured(): boolean {
  return getKitV3Config() !== null || getKitV4Config() !== null;
}

async function kitV4Fetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  const config = getKitV4Config();
  if (!config) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[dev] Kit API skipped: ${path}`);
      return { data: undefined };
    }
    return { error: "Kit email list is not configured (KIT_API_KEY, KIT_FORM_ID)" };
  }

  const res = await fetch(`${KIT_V4_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": config.apiKey,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    return { error: `Kit API error (${res.status}): ${body}` };
  }

  if (res.status === 204) return { data: undefined };
  const data = (await res.json()) as T;
  return { data };
}

async function subscribeToKitV3({
  email,
  firstName,
}: {
  email: string;
  firstName?: string | null;
}): Promise<{ subscriberId?: string; error?: string }> {
  const config = getKitV3Config();
  if (!config) return { error: "Kit email list is not configured" };

  const normalizedEmail = email.trim().toLowerCase();
  const res = await fetch(`${KIT_V3_API_BASE}/forms/${config.formId}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: config.apiKey,
      email: normalizedEmail,
      first_name: firstName?.trim() || undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { error: `Kit API error (${res.status}): ${body}` };
  }

  const data = (await res.json()) as {
    subscription?: { subscriber?: { id?: number } };
  };
  const subscriberId = data.subscription?.subscriber?.id;
  if (!subscriberId) {
    return { error: "Kit did not return a subscriber ID" };
  }

  return { subscriberId: String(subscriberId) };
}

async function subscribeToKitV4({
  email,
  firstName,
}: {
  email: string;
  firstName?: string | null;
}): Promise<{ subscriberId?: string; error?: string }> {
  const config = getKitV4Config();
  if (!config) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[dev] Kit subscribe: ${email}`);
      return { subscriberId: "dev-subscriber" };
    }
    return { error: "Kit email list is not configured" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const createResult = await kitV4Fetch<{ subscriber: KitSubscriber }>("/subscribers", {
    method: "POST",
    body: JSON.stringify({
      email_address: normalizedEmail,
      first_name: firstName?.trim() || undefined,
      state: "active",
    }),
  });

  if (createResult.error) return { error: createResult.error };

  const subscriber = createResult.data?.subscriber;
  if (!subscriber?.id) {
    return { error: "Kit did not return a subscriber ID" };
  }

  const addResult = await kitV4Fetch<{ subscriber: KitSubscriber }>(
    `/forms/${config.formId}/subscribers/${subscriber.id}`,
    { method: "POST" }
  );

  if (addResult.error) return { error: addResult.error };

  return { subscriberId: String(subscriber.id) };
}

/** Create or update a Kit subscriber and add them to the configured form. */
export async function subscribeToKit({
  email,
  firstName,
}: {
  email: string;
  firstName?: string | null;
}): Promise<{ subscriberId?: string; error?: string }> {
  if (getKitV3Config()) {
    return subscribeToKitV3({ email, firstName });
  }
  return subscribeToKitV4({ email, firstName });
}

/** Unsubscribe a subscriber from Kit. */
export async function unsubscribeFromKit(
  subscriberId: string,
  email?: string | null
): Promise<{ error?: string }> {
  const v3 = getKitV3Config();
  if (v3) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      return { error: "Email is required to unsubscribe via Kit v3" };
    }

    const res = await fetch(`${KIT_V3_API_BASE}/unsubscribe`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_secret: v3.apiSecret,
        email: normalizedEmail,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { error: `Kit API error (${res.status}): ${body}` };
    }

    return {};
  }

  const result = await kitV4Fetch(`/subscribers/${subscriberId}`, {
    method: "PUT",
    body: JSON.stringify({ state: "cancelled" }),
  });
  if (result.error) return { error: result.error };
  return {};
}

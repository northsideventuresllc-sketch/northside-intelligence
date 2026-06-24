import "server-only";

const KIT_API_BASE = "https://api.kit.com/v4";

export interface KitSubscriber {
  id: number;
  email_address: string;
  first_name: string | null;
  state: string;
}

function getKitConfig(): { apiKey: string; formId: string } | null {
  const apiKey = process.env.KIT_API_KEY?.trim();
  const formId = process.env.KIT_FORM_ID?.trim();
  if (!apiKey || !formId) return null;
  return { apiKey, formId };
}

export function isKitConfigured(): boolean {
  return getKitConfig() !== null;
}

async function kitFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  const config = getKitConfig();
  if (!config) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[dev] Kit API skipped: ${path}`);
      return { data: undefined };
    }
    return { error: "Kit email list is not configured (KIT_API_KEY, KIT_FORM_ID)" };
  }

  const res = await fetch(`${KIT_API_BASE}${path}`, {
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

/** Create or update a Kit subscriber and add them to the configured form. */
export async function subscribeToKit({
  email,
  firstName,
}: {
  email: string;
  firstName?: string | null;
}): Promise<{ subscriberId?: string; error?: string }> {
  const config = getKitConfig();
  if (!config) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[dev] Kit subscribe: ${email}`);
      return { subscriberId: "dev-subscriber" };
    }
    return { error: "Kit email list is not configured" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const createResult = await kitFetch<{ subscriber: KitSubscriber }>("/subscribers", {
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

  const addResult = await kitFetch<{ subscriber: KitSubscriber }>(
    `/forms/${config.formId}/subscribers/${subscriber.id}`,
    { method: "POST" }
  );

  if (addResult.error) return { error: addResult.error };

  return { subscriberId: String(subscriber.id) };
}

/** Unsubscribe a subscriber from Kit (set inactive). */
export async function unsubscribeFromKit(subscriberId: string): Promise<{ error?: string }> {
  const result = await kitFetch(`/subscribers/${subscriberId}`, {
    method: "PUT",
    body: JSON.stringify({ state: "cancelled" }),
  });
  if (result.error) return { error: result.error };
  return {};
}

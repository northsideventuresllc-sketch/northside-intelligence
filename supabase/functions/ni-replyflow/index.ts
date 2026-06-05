import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.25.0";

type UserPlan = "free" | "solo" | "team" | "agency";

const PLAN_LIMITS: Record<UserPlan, number> = {
  free: 10,
  solo: 100,
  team: 1000,
  agency: 999999,
};

interface ReplyFlowSecrets {
  gateway: string;
  anthropicApiKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
}

async function loadSecrets(
  admin: ReturnType<typeof createClient>
): Promise<ReplyFlowSecrets> {
  const { data, error } = await admin.rpc("ni_replyflow_get_secrets");
  if (error || !data?.[0]) {
    throw new Error("ReplyFlow secrets are not configured");
  }
  const row = data[0] as {
    gateway_secret: string;
    anthropic_api_key: string;
    stripe_secret_key: string;
    stripe_webhook_secret: string;
  };
  return {
    gateway: row.gateway_secret,
    anthropicApiKey: row.anthropic_api_key,
    stripeSecretKey: row.stripe_secret_key,
    stripeWebhookSecret: row.stripe_webhook_secret,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function normalizeUserPlan(plan: string | null | undefined): UserPlan {
  const valid: UserPlan[] = ["free", "solo", "team", "agency"];
  if (plan && valid.includes(plan as UserPlan)) return plan as UserPlan;
  return "free";
}

function getPlanFromPriceId(
  priceId: string | undefined,
  priceMap: Record<string, UserPlan>
): UserPlan {
  if (!priceId) return "free";
  return priceMap[priceId] ?? "free";
}

async function callClaude(apiKey: string, systemPrompt: string, userMessage: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status}`);
  }
  const data = await res.json();
  return (
    data.content.find((c: { type: string; text?: string }) => c.type === "text")?.text ?? ""
  );
}

async function getUserFromRequest(
  req: Request,
  supabaseUrl: string,
  anonKey: string
) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function setProfilePlan(
  admin: ReturnType<typeof createClient>,
  filter: { column: "id" | "stripe_customer_id"; value: string },
  plan: UserPlan,
  extra?: { stripe_customer_id?: string; stripe_subscription_id?: string | null }
) {
  const payload: Record<string, unknown> = { plan, updated_at: new Date().toISOString(), ...extra };
  if (extra?.stripe_subscription_id === null) payload.stripe_subscription_id = null;

  const { error } = await admin
    .from("replyflow_profiles")
    .update(payload)
    .eq(filter.column, filter.value);

  if (error) throw new Error(error.message);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let secrets: ReplyFlowSecrets;
  try {
    secrets = await loadSecrets(admin);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Secret load failed";
    return jsonResponse({ error: message }, 500);
  }

  const stripeSignature = req.headers.get("stripe-signature");
  if (stripeSignature) {
    if (!secrets.stripeWebhookSecret || !secrets.stripeSecretKey) {
      return jsonResponse({ error: "Stripe webhook not configured" }, 500);
    }

    const body = await req.text();
    const stripe = new Stripe(secrets.stripeSecretKey, { apiVersion: "2023-10-16" });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, stripeSignature, secrets.stripeWebhookSecret);
    } catch {
      return jsonResponse({ error: "Invalid signature" }, 400);
    }

    const priceMap: Record<string, UserPlan> = {
      [Deno.env.get("STRIPE_SOLO_PRICE_ID") ?? "price_1Te0s8QXb5thRQWgqVQdW8Rl"]: "solo",
      [Deno.env.get("STRIPE_TEAM_PRICE_ID") ?? "price_1Te0sBQXb5thRQWgYzuWMxTd"]: "team",
      [Deno.env.get("STRIPE_AGENCY_PRICE_ID") ?? "price_1Te0sEQXb5thRQWgCiAzrClk"]: "agency",
    };

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          if (!userId || !session.subscription) break;
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const plan = getPlanFromPriceId(sub.items.data[0]?.price.id, priceMap);
          await setProfilePlan(
            admin,
            { column: "id", value: userId },
            plan,
            {
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
            }
          );
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          await setProfilePlan(
            admin,
            { column: "stripe_customer_id", value: sub.customer as string },
            "free",
            { stripe_subscription_id: null }
          );
          break;
        }
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = sub.customer as string;
          if (sub.status === "active") {
            await setProfilePlan(
              admin,
              { column: "stripe_customer_id", value: customerId },
              getPlanFromPriceId(sub.items.data[0]?.price.id, priceMap)
            );
          } else if (sub.status === "canceled" || sub.status === "unpaid") {
            await setProfilePlan(
              admin,
              { column: "stripe_customer_id", value: customerId },
              "free",
              { stripe_subscription_id: null }
            );
          }
          break;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Handler failed";
      return jsonResponse({ error: message }, 500);
    }

    return jsonResponse({ received: true });
  }

  const gateway = req.headers.get("x-ni-replyflow-gateway") ?? "";
  if (!gateway || gateway !== secrets.gateway) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const action = String(body.action ?? "");
  const user = await getUserFromRequest(req, supabaseUrl, anonKey);
  if (!user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (action === "generate") {
    if (!secrets.anthropicApiKey) {
      return jsonResponse({ error: "Reply generation not configured" }, 500);
    }

    const { data: profile, error: profileError } = await admin
      .from("replyflow_profiles")
      .select("plan, replies_used_this_month, replies_reset_at")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return jsonResponse({ error: "Profile not found" }, 404);
    }

    const plan = normalizeUserPlan(profile.plan);
    const limit = PLAN_LIMITS[plan] ?? 10;
    const resetAt = new Date(profile.replies_reset_at);
    const now = new Date();
    const monthsSince =
      (now.getFullYear() - resetAt.getFullYear()) * 12 + (now.getMonth() - resetAt.getMonth());
    let repliesUsed = profile.replies_used_this_month;
    if (monthsSince >= 1) {
      repliesUsed = 0;
      await admin
        .from("replyflow_profiles")
        .update({ replies_used_this_month: 0, replies_reset_at: now.toISOString() })
        .eq("id", user.id);
    }
    if (repliesUsed >= limit) {
      return jsonResponse(
        { error: `Reply limit reached (${limit}/mo on ${plan} plan).` },
        429
      );
    }

    const message = String(body.message ?? "");
    const tone = String(body.tone ?? "");
    const scenario = String(body.scenario ?? "");
    if (!message || !tone || !scenario) {
      return jsonResponse({ error: "Missing fields" }, 400);
    }

    try {
      const systemPrompt = `You are a customer service expert. Write a ${tone} customer service reply for a ${scenario} scenario. Be concise, empathetic, and professional. Return only the reply text.`;
      const reply = await callClaude(secrets.anthropicApiKey, systemPrompt, message);

      await admin
        .from("replyflow_profiles")
        .update({ replies_used_this_month: repliesUsed + 1 })
        .eq("id", user.id);

      return jsonResponse({ reply, usage: { used: repliesUsed + 1, limit } });
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : "Internal error";
      return jsonResponse({ error: errMessage }, 500);
    }
  }

  if (action === "checkout") {
    if (!secrets.stripeSecretKey) {
      return jsonResponse({ error: "Checkout not configured" }, 500);
    }

    const priceId = String(body.priceId ?? "");
    const successUrl = String(body.successUrl ?? "");
    const cancelUrl = String(body.cancelUrl ?? "");
    if (!priceId || !successUrl || !cancelUrl) {
      return jsonResponse({ error: "Invalid checkout request" }, 400);
    }

    const stripe = new Stripe(secrets.stripeSecretKey, { apiVersion: "2023-10-16" });
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: user.email,
        metadata: { userId: user.id },
      });
      return jsonResponse({ url: session.url });
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : "Checkout failed";
      return jsonResponse({ error: errMessage }, 500);
    }
  }

  return jsonResponse({ error: "Unknown action" }, 400);
});

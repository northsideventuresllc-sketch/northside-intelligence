import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type OtpPurpose = "signup" | "signin";

interface VaultSecrets {
  gateway: string;
  resendApiKey: string;
  resendFrom: string;
}

async function loadSecrets(
  admin: ReturnType<typeof createClient>
): Promise<VaultSecrets> {
  const { data, error } = await admin.rpc("ni_portal_get_auth_secrets");
  if (error || !data?.[0]) {
    throw new Error("Auth secrets are not configured");
  }
  const row = data[0] as {
    gateway_secret: string;
    resend_api_key: string;
    resend_from_email: string;
  };
  return {
    gateway: row.gateway_secret,
    resendApiKey: row.resend_api_key,
    resendFrom: row.resend_from_email,
  };
}

async function hashOtpAsync(code: string): Promise<string> {
  const data = new TextEncoder().encode(code.trim());
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail({
  resendApiKey,
  from,
  to,
  code,
  purpose,
}: {
  resendApiKey: string;
  from: string;
  to: string;
  code: string;
  purpose: OtpPurpose;
}) {
  const action =
    purpose === "signup" ? "complete your signup" : "sign in securely";
  const idempotencyKey = `otp/${purpose}/${to.toLowerCase()}/${Math.floor(Date.now() / 60000)}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `${code} is your Northside Intelligence verification code`,
      html: `
        <div style="font-family: system-ui, sans-serif; background: #07080c; color: #e8eaef; padding: 32px;">
          <p style="color: #8b95a8; font-size: 14px; margin: 0 0 16px;">Northside Intelligence</p>
          <h1 style="font-size: 22px; margin: 0 0 12px; color: #00d4ff;">Verify your email</h1>
          <p style="color: #8b95a8; line-height: 1.6;">Use this code to ${action}:</p>
          <p style="font-size: 32px; letter-spacing: 0.3em; font-weight: 700; color: #ffffff; margin: 24px 0;">${code}</p>
          <p style="color: #8b95a8; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to send email: ${body}`);
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let secrets: VaultSecrets;
  try {
    secrets = await loadSecrets(admin);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Secret load failed";
    return jsonResponse({ error: message }, 500);
  }

  const gateway = req.headers.get("x-ni-auth-gateway") ?? "";
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

  if (action === "issue-otp") {
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const purpose = body.purpose as OtpPurpose;
    const metadata = (body.metadata as Record<string, unknown>) ?? {};

    if (!email || (purpose !== "signup" && purpose !== "signin")) {
      return jsonResponse({ error: "Invalid OTP request" }, 400);
    }

    const code = generateOtp();
    const codeHash = await hashOtpAsync(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    const { error } = await admin.from("ni_auth_otp").insert({
      email,
      code_hash: codeHash,
      purpose,
      metadata,
      expires_at: expiresAt,
    });

    if (error) {
      return jsonResponse({ error: `Failed to store OTP: ${error.message}` }, 500);
    }

    try {
      await sendOtpEmail({
        resendApiKey: secrets.resendApiKey,
        from: secrets.resendFrom,
        to: email,
        code,
        purpose,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send email";
      return jsonResponse({ error: message }, 500);
    }

    return jsonResponse({ expiresAt });
  }

  if (action === "create-pending") {
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");
    const flow = body.flow as "signup" | "signin";
    const fullName = body.fullName ? String(body.fullName).trim() : null;
    const returnTo = body.returnTo ? String(body.returnTo) : null;
    const metadata = (body.metadata as Record<string, unknown>) ?? {};

    if (!email || !password || (flow !== "signup" && flow !== "signin")) {
      return jsonResponse({ error: "Invalid pending session request" }, 400);
    }

    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
    const { data, error } = await admin
      .from("ni_auth_pending")
      .insert({
        email,
        password,
        flow,
        full_name: fullName,
        return_to: returnTo,
        metadata,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (error || !data) {
      return jsonResponse({ error: "Failed to create pending session" }, 500);
    }

    return jsonResponse({ pendingId: data.id, expiresAt });
  }

  if (action === "verify") {
    const pendingId = String(body.pendingId ?? "");
    const code = String(body.code ?? "").trim();

    if (!pendingId || !code) {
      return jsonResponse({ error: "Verification code is required" }, 400);
    }

    const { data: pending, error: pendingError } = await admin
      .from("ni_auth_pending")
      .select("id, email, password, flow, full_name, return_to, metadata, expires_at")
      .eq("id", pendingId)
      .maybeSingle();

    if (pendingError || !pending) {
      return jsonResponse({ error: "Session expired. Please start again." }, 400);
    }

    if (new Date(pending.expires_at) < new Date()) {
      await admin.from("ni_auth_pending").delete().eq("id", pendingId);
      return jsonResponse({ error: "Session expired. Please start again." }, 400);
    }

    const purpose: OtpPurpose = pending.flow === "signup" ? "signup" : "signin";
    const normalizedEmail = pending.email.toLowerCase().trim();

    const { data: rows, error: otpError } = await admin
      .from("ni_auth_otp")
      .select("id, code_hash, metadata, expires_at, used_at, attempts")
      .eq("email", normalizedEmail)
      .eq("purpose", purpose)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (otpError || !rows?.[0]) {
      return jsonResponse({ error: "Invalid or expired verification code" }, 401);
    }

    const row = rows[0];
    if (row.used_at || new Date(row.expires_at) < new Date()) {
      return jsonResponse({ error: "Invalid or expired verification code" }, 401);
    }

    if ((row.attempts ?? 0) >= MAX_ATTEMPTS) {
      return jsonResponse({ error: "Invalid or expired verification code" }, 401);
    }

    const codeHash = await hashOtpAsync(code);
    const valid = row.code_hash === codeHash;

    await admin
      .from("ni_auth_otp")
      .update({
        attempts: (row.attempts ?? 0) + 1,
        ...(valid ? { used_at: new Date().toISOString() } : {}),
      })
      .eq("id", row.id);

    if (!valid) {
      return jsonResponse({ error: "Invalid or expired verification code" }, 401);
    }

    if (pending.flow === "signup") {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: pending.email,
        password: pending.password,
        email_confirm: true,
        user_metadata: pending.full_name ? { full_name: pending.full_name } : undefined,
      });

      if (createError || !created.user) {
        const duplicate =
          createError?.message?.toLowerCase().includes("already") ||
          createError?.message?.toLowerCase().includes("registered");
        return jsonResponse(
          {
            error: duplicate
              ? "An account with this email already exists"
              : (createError?.message ?? "Failed to create account"),
          },
          duplicate ? 409 : 500
        );
      }

      const now = new Date().toISOString();
      const signupMeta = (pending.metadata as Record<string, unknown>) ?? {};
      const username =
        typeof signupMeta.username === "string"
          ? signupMeta.username.trim().toLowerCase()
          : null;
      const twoFactorEnabled = signupMeta.twoFactorEnabled !== false;

      await admin.from("ni_portal_profiles").upsert({
        id: created.user.id,
        email: pending.email,
        full_name: pending.full_name,
        username,
        two_factor_enabled: twoFactorEnabled,
        updated_at: now,
      });

      await admin.from("replyflow_profiles").upsert(
        {
          id: created.user.id,
          email: pending.email,
          plan: "free",
          replies_used_this_month: 0,
          replies_reset_at: now,
          created_at: now,
          updated_at: now,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

      await admin.from("grantbot_profiles").upsert(
        {
          id: created.user.id,
          email: pending.email,
          tier: "free",
          grants_used_this_month: 0,
          grants_reset_at: now,
          created_at: now,
          updated_at: now,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

      await admin.from("ni_subscriptions").upsert(
        { id: created.user.id, tier: "free", updated_at: now },
        { onConflict: "id", ignoreDuplicates: true }
      );
    }

    const { data: sessionData, error: signInError } =
      await admin.auth.signInWithPassword({
        email: pending.email,
        password: pending.password,
      });

    await admin.from("ni_auth_pending").delete().eq("id", pendingId);

    if (signInError || !sessionData.session) {
      return jsonResponse({ error: "Failed to sign in after verification" }, 500);
    }

    return jsonResponse({
      success: true,
      returnTo: pending.return_to,
      accessToken: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
    });
  }

  return jsonResponse({ error: "Unknown action" }, 400);
});

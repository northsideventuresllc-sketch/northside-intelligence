import { randomBytes, createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

export interface AgentKeyRecord {
  id: string;
  userId: string;
  toolSlug: string;
  name: string;
  keyPrefix: string;
  status: "active" | "revoked";
  createdAt: string;
  lastUsedAt?: string | null;
}

export function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey.trim()).digest("hex");
}

export async function generateAgentKey(params: {
  userId: string;
  toolSlug: string;
  name?: string;
}): Promise<{ rawKey: string; keyRecord: AgentKeyRecord }> {
  const secretRandom = randomBytes(24).toString("hex");
  const rawKey = `ni_agt_${secretRandom}`;
  const keyPrefix = rawKey.slice(0, 11); // e.g. "ni_agt_1a2b"
  const hashed = hashKey(rawKey);
  const keyName = params.name || `${params.toolSlug.toUpperCase()} Headless Agent`;
  const service = createServiceClient();

  const id = randomBytes(16).toString("hex");
  const now = new Date().toISOString();

  // Attempt insert into user_agent_keys table (if table exists)
  try {
    await service.from("user_agent_keys").insert({
      id,
      user_id: params.userId,
      tool_slug: params.toolSlug,
      name: keyName,
      key_prefix: keyPrefix,
      key_hash: hashed,
      status: "active",
      created_at: now,
    });
  } catch (err) {
    console.warn("Could not insert into user_agent_keys table (may be pending migration):", err);
  }

  const keyRecord: AgentKeyRecord = {
    id,
    userId: params.userId,
    toolSlug: params.toolSlug,
    name: keyName,
    keyPrefix,
    status: "active",
    createdAt: now,
  };

  return { rawKey, keyRecord };
}

export async function listAgentKeys(userId: string, toolSlug?: string): Promise<AgentKeyRecord[]> {
  const service = createServiceClient();
  try {
    let query = service
      .from("user_agent_keys")
      .select("id, user_id, tool_slug, name, key_prefix, status, created_at, last_used_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (toolSlug) {
      query = query.eq("tool_slug", toolSlug);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      toolSlug: row.tool_slug,
      name: row.name,
      keyPrefix: row.key_prefix,
      status: row.status,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
    }));
  } catch {
    return [];
  }
}

export async function revokeAgentKey(userId: string, keyId: string): Promise<boolean> {
  const service = createServiceClient();
  try {
    const { error } = await service
      .from("user_agent_keys")
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("id", keyId)
      .eq("user_id", userId);

    return !error;
  } catch {
    return false;
  }
}

export async function validateAgentKey(
  authHeader: string | null,
  requiredToolSlug?: string
): Promise<{ valid: boolean; userId?: string; toolSlug?: string; error?: string }> {
  if (!authHeader) {
    return { valid: false, error: "Missing Authorization header." };
  }

  const match = authHeader.match(/^Bearer\s+(ni_agt_[a-f0-9]+)$/i);
  if (!match) {
    return { valid: false, error: "Invalid API key format. Expected 'Bearer ni_agt_...'" };
  }

  const rawKey = match[1];
  const hashed = hashKey(rawKey);
  const service = createServiceClient();

  try {
    const { data, error } = await service
      .from("user_agent_keys")
      .select("id, user_id, tool_slug, status")
      .eq("key_hash", hashed)
      .eq("status", "active")
      .maybeSingle();

    if (error || !data) {
      return { valid: false, error: "Invalid or revoked agent API key." };
    }

    if (requiredToolSlug && data.tool_slug !== requiredToolSlug && data.tool_slug !== "general") {
      return {
        valid: false,
        error: `Agent key is scoped to '${data.tool_slug}', but '${requiredToolSlug}' is required.`,
      };
    }

    // Update last_used_at asynchronously
    service
      .from("user_agent_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id)
      .then();

    return { valid: true, userId: data.user_id, toolSlug: data.tool_slug };
  } catch (err) {
    return { valid: false, error: "Agent key verification error." };
  }
}

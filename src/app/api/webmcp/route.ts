import { NextRequest, NextResponse } from "next/server";
import { manifest, findTool } from "@/lib/webmcp/manifest";
import { runTool } from "@/lib/webmcp/dispatch";
import {
  JSON_RPC_ERRORS,
  isNotification,
  isValidJsonRpcRequest,
  negotiateProtocolVersion,
  newSessionId,
  rpcErrorBody,
  rpcResultBody,
  type JsonRpcId,
  type JsonRpcRequest,
} from "@/lib/webmcp/lane5/protocol";
import { annotationsFor } from "@/lib/webmcp/lane5/annotations";
import { clientKeyFromHeaders, rateLimitCheck } from "@/lib/webmcp/lane5/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Agent-Engine, X-Agent-Signature, MCP-Protocol-Version, Mcp-Session-Id",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, MCP-Protocol-Version",
} as const;

function getManifest() {
  return manifest;
}

// GET serves the human/agent-readable manifest, unless the caller is asking for a
// server-initiated SSE stream on the endpoint — this server does not offer one
// (spec 2025-06-18 §Streamable HTTP: server-initiated GET SSE is OPTIONAL).
export async function GET(req: NextRequest) {
  const accept = req.headers.get("accept") || "";
  if (accept.toLowerCase().includes("text/event-stream")) {
    return NextResponse.json(
      { error: "Server-initiated SSE is not supported on this endpoint." },
      { status: 405, headers: CORS_HEADERS }
    );
  }

  const manifest = getManifest();
  return NextResponse.json(manifest, { headers: CORS_HEADERS });
}

/** Processes a single JSON-RPC request/notification object. Returns null for a notification (no body owed). */
async function handleRpcCall(
  raw: unknown,
  req: NextRequest
): Promise<{ status: number; body: unknown } | null> {
  if (!isValidJsonRpcRequest(raw)) {
    const id: JsonRpcId = raw && typeof raw === "object" && "id" in (raw as Record<string, unknown>)
      ? ((raw as Record<string, unknown>).id as JsonRpcId) ?? null
      : null;
    return { status: 200, body: rpcErrorBody(id, JSON_RPC_ERRORS.INVALID_REQUEST, "Invalid Request") };
  }

  const rpc = raw as JsonRpcRequest;
  const id: JsonRpcId = (rpc.id as JsonRpcId) ?? null;
  const method = rpc.method as string;
  const manifest = getManifest();

  if (isNotification(rpc)) {
    // Notifications (e.g. notifications/initialized) never get a JSON-RPC response body.
    return null;
  }

  switch (method) {
    case "initialize": {
      const protocolVersion = negotiateProtocolVersion(rpc.params?.protocolVersion);
      return {
        status: 200,
        body: rpcResultBody(id, {
          protocolVersion,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "Northside-Intelligence-WebMCP", version: "1.1.0" },
          instructions:
            "Northside Intelligence automated multi-sector tools for agents: coaching, subscriptions, site gap audits, signal briefs, and grant search.",
        }),
      };
    }

    case "ping": {
      return { status: 200, body: rpcResultBody(id, {}) };
    }

    case "tools/list": {
      return {
        status: 200,
        body: rpcResultBody(id, {
          tools: manifest.tools.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.parameters || { type: "object", properties: {} },
            ...(annotationsFor(t.name) ? { annotations: annotationsFor(t.name) } : {}),
          })),
        }),
      };
    }

    case "tools/call": {
      const toolName = rpc.params?.name;
      const toolParams = (rpc.params?.arguments as Record<string, unknown>) || {};

      const tool = findTool(toolName);
      if (!tool) {
        return {
          status: 200,
          body: rpcErrorBody(id, JSON_RPC_ERRORS.INVALID_PARAMS, `Tool '${String(toolName)}' not found.`),
        };
      }

      const fulfillmentResult = await runTool(tool, toolParams, req);
      return {
        status: 200,
        body: rpcResultBody(id, {
          content: [{ type: "text", text: JSON.stringify(fulfillmentResult, null, 2) }],
          isError: fulfillmentResult.status === "unavailable" || fulfillmentResult.status === "invalid_input",
        }),
      };
    }

    default:
      return { status: 200, body: rpcErrorBody(id, JSON_RPC_ERRORS.METHOD_NOT_FOUND, `Method '${method}' not implemented.`) };
  }
}

export async function POST(req: NextRequest) {
  const clientKey = clientKeyFromHeaders(req.headers);
  const rate = rateLimitCheck(clientKey);
  if (!rate.allowed) {
    return NextResponse.json(
      rpcErrorBody(null, JSON_RPC_ERRORS.RATE_LIMITED, "Rate limit exceeded. Try again shortly."),
      { status: 429, headers: { ...CORS_HEADERS, "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    const text = await req.text();
    body = text.length ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json(rpcErrorBody(null, JSON_RPC_ERRORS.PARSE_ERROR, "Parse error"), {
      status: 200,
      headers: CORS_HEADERS,
    });
  }

  const protocolVersionHeader = req.headers.get("mcp-protocol-version");
  const responseHeaders: Record<string, string> = { ...CORS_HEADERS };
  if (protocolVersionHeader) responseHeaders["MCP-Protocol-Version"] = negotiateProtocolVersion(protocolVersionHeader);

  // ----------------------------------------------------
  // 1. JSON-RPC 2.0 (single request or batch array)
  // ----------------------------------------------------
  const looksLikeRpc = Array.isArray(body) || (body && typeof body === "object" && ("jsonrpc" in (body as object) || "method" in (body as object)));

  if (looksLikeRpc) {
    try {
      if (Array.isArray(body)) {
        if (body.length === 0) {
          return NextResponse.json(rpcErrorBody(null, JSON_RPC_ERRORS.INVALID_REQUEST, "Invalid Request"), {
            status: 200,
            headers: responseHeaders,
          });
        }

        const results = await Promise.all(body.map((item) => handleRpcCall(item, req)));
        const responses = results.filter((r): r is { status: number; body: unknown } => r !== null).map((r) => r.body);

        if (responses.length === 0) {
          // Entire batch was notifications — nothing is owed back.
          return new NextResponse(null, { status: 202, headers: responseHeaders });
        }

        const isInit = body.some((item) => item && typeof item === "object" && (item as JsonRpcRequest).method === "initialize");
        if (isInit) responseHeaders["Mcp-Session-Id"] = newSessionId();

        return NextResponse.json(responses, { status: 200, headers: responseHeaders });
      }

      const single = await handleRpcCall(body, req);
      if (single === null) {
        // Pure notification (e.g. notifications/initialized).
        return new NextResponse(null, { status: 202, headers: responseHeaders });
      }

      const rpc = body as JsonRpcRequest;
      if (rpc.method === "initialize") {
        responseHeaders["Mcp-Session-Id"] = newSessionId();
        responseHeaders["MCP-Protocol-Version"] = negotiateProtocolVersion(rpc.params?.protocolVersion);
      }

      return NextResponse.json(single.body, { status: single.status, headers: responseHeaders });
    } catch (err) {
      console.error("[webmcp] rpc error:", err);
      return NextResponse.json(
        rpcErrorBody(null, JSON_RPC_ERRORS.INTERNAL_ERROR, "Internal error"),
        { status: 200, headers: responseHeaders }
      );
    }
  }

  // ----------------------------------------------------
  // 2. Direct WebMCP Simplified REST Handler
  //    (offered_price_usd floor check removed — payment is enforced by Stripe
  //    Checkout at charge time via createWebmcpCheckout, not by a client-supplied
  //    price field on either the REST or JSON-RPC path. See docs/webmcp/directory-submission.md.)
  // ----------------------------------------------------
  try {
    const { tool_name, parameters = {}, natural_query } = (body as Record<string, unknown>) || {};
    const manifest = getManifest();
    const tool = findTool(tool_name);
    if (!tool) {
      return NextResponse.json(
        { error: `Tool '${String(tool_name)}' not found.`, available_tools: manifest.tools.map((t) => t.name) },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const result = await runTool(tool, parameters as Record<string, unknown>, req, natural_query as string | undefined);

    return NextResponse.json({ tool: tool_name, product: tool.product, ...result }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[webmcp] rest error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

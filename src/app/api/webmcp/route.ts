import { NextRequest, NextResponse } from "next/server";
import { manifest, findTool } from "@/lib/webmcp/manifest";
import { runTool } from "@/lib/webmcp/dispatch";

function getManifest() {
  return manifest;
}

export async function GET() {
  const manifest = getManifest();
  return NextResponse.json(manifest, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Agent-Engine, X-Agent-Signature",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const manifest = getManifest();

    // ----------------------------------------------------
    // 1. Standard MCP JSON-RPC 2.0 Protocol Handler
    // ----------------------------------------------------
    if (body.jsonrpc === "2.0" || body.method) {
      const id = body.id ?? 1;
      const method = body.method;

      if (method === "initialize") {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {
                listChanged: false
              }
            },
            serverInfo: {
              name: "Northside-Intelligence-WebMCP",
              version: "1.0.0"
            },
            instructions: "Northside Intelligence automated multi-sector tools for agents: coaching, subscriptions, site gap audits, signal briefs, and grant search."
          }
        }, {
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }

      if (method === "notifications/initialized" || method === "initialized") {
        return new NextResponse(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
      }

      if (method === "ping") {
        return NextResponse.json({ jsonrpc: "2.0", id, result: {} }, { headers: { "Access-Control-Allow-Origin": "*" } });
      }

      if (method === "tools/list") {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            tools: manifest.tools.map((t) => ({
              name: t.name,
              description: t.description,
              inputSchema: t.parameters || { type: "object", properties: {} }
            }))
          }
        }, {
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }

      if (method === "tools/call") {
        const toolName = body.params?.name;
        const toolParams = body.params?.arguments || {};
        
        const tool = findTool(toolName);
        if (!tool) {
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Tool '${toolName}' not found.` }
          }, { status: 404, headers: { "Access-Control-Allow-Origin": "*" } });
        }

        const fulfillmentResult = await runTool(tool, toolParams, req);
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(fulfillmentResult, null, 2)
              }
            ],
            isError: fulfillmentResult.status === "unavailable" || fulfillmentResult.status === "invalid_input"
          }
        }, { headers: { "Access-Control-Allow-Origin": "*" } });
      }

      // Default JSON-RPC fallback
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method '${method}' not implemented.` }
      }, { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    // ----------------------------------------------------
    // 2. Direct WebMCP Simplified REST Handler
    // ----------------------------------------------------
    const { tool_name, parameters = {}, natural_query } = body;
    const tool = findTool(tool_name);
    if (!tool) {
      return NextResponse.json({
        error: `Tool '${tool_name}' not found.`,
        available_tools: manifest.tools.map((t) => t.name),
      }, { status: 404, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    if (parameters.offered_price_usd !== undefined && parameters.offered_price_usd < tool.floor_price_usd) {
      return NextResponse.json({
        error: `Offered price $${parameters.offered_price_usd} is below minimum floor of $${tool.floor_price_usd}.`,
        floor_price_usd: tool.floor_price_usd,
      }, { status: 402, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    const result = await runTool(tool, parameters, req, natural_query);

    return NextResponse.json({
      tool: tool_name,
      product: tool.product,
      ...result,
    }, {
      headers: { "Access-Control-Allow-Origin": "*" }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Agent-Engine, X-Agent-Signature",
    },
  });
}

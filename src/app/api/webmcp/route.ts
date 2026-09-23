import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import fs from "node:fs";
import path from "node:path";

function getManifest() {
  const filePath = path.join(process.cwd(), "public", ".well-known", "webmcp.json");
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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
    const engine = req.headers.get("x-agent-engine") || req.headers.get("user-agent") || "unknown_crawler";
    const signature = req.headers.get("x-agent-signature") || "unsigned";

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
            tools: manifest.tools.map((t: any) => ({
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
        
        const tool = manifest.tools.find((t: any) => t.name === toolName);
        if (!tool) {
          return NextResponse.json({
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Tool '${toolName}' not found.` }
          }, { status: 404, headers: { "Access-Control-Allow-Origin": "*" } });
        }

        const fulfillmentResult = await executeTool(tool, toolParams, engine, signature, req);
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(fulfillmentResult, null, 2)
              }
            ]
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
    const tool = manifest.tools.find((t: any) => t.name === tool_name);
    if (!tool) {
      return NextResponse.json({
        error: `Tool '${tool_name}' not found.`,
        available_tools: manifest.tools.map((t: any) => t.name),
      }, { status: 404, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    if (parameters.offered_price_usd !== undefined && parameters.offered_price_usd < tool.floor_price_usd) {
      return NextResponse.json({
        error: `Offered price $${parameters.offered_price_usd} is below minimum floor of $${tool.floor_price_usd}.`,
        floor_price_usd: tool.floor_price_usd,
      }, { status: 402, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    const execution = await executeTool(tool, parameters, engine, signature, req, natural_query);

    return NextResponse.json({
      success: true,
      transaction_id: execution.txId,
      tool: tool_name,
      product: tool.product,
      sector: tool.sector,
      attribution: { engine, signature },
      status: "fulfilled",
      fulfillment: execution.fulfillmentPayload,
      message: `Successfully executed ${tool_name} via Northside Intelligence WebMCP.`
    }, {
      headers: { "Access-Control-Allow-Origin": "*" }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

async function executeTool(tool: any, parameters: any, engine: string, signature: string, req: NextRequest, natural_query?: string) {
  let authUserId = "ccd98883-214d-47c0-96a9-e65a58005f3d"; // JB primary auth user
  let axonAccountId = "7e82a9db-b86e-4f21-b797-99b6931c9728"; // Default AXON account
  let supabase = null;
  try {
    supabase = createServiceClient();
    const { data: acct } = await supabase.from("axon_accounts").select("id").limit(1).maybeSingle();
    if (acct?.id) {
      axonAccountId = acct.id;
    }
  } catch (err: any) {
    console.warn("[WebMCP] Service client init fallback:", err.message);
  }

  let fulfillmentPayload: Record<string, any> = {};
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  if (supabase) {
    try {
      const clientName = parameters.client_name || "Autonomous Buyer Agent";
      const clientEmail = parameters.account_email || parameters.client_email || "buyer@northsideintelligence.com";
      const priceCents = parameters.offered_price_usd
        ? Math.round(parameters.offered_price_usd * 100)
        : Math.round((tool.floor_price_usd || 15) * 100);

      if (tool.name === "ni_replyflow_subscribe") {
        const tier = parameters.tier || "pro";
        
        await supabase.from("outreach_leads").insert({
          venture: "ni",
          channel: "other",
          full_name: clientName,
          email: clientEmail,
          company: engine,
          source: "webmcp_buyer_catching",
          why: `Subscribed to ReplyFlow (${tier}) via WebMCP`,
          score: 95,
          status: "new"
        });

        const { data: srv } = await supabase.from("ni_service_requests").insert({
          user_id: authUserId,
          service_slug: "replyflow_subscription",
          account_type: "business",
          status: "pending",
          payload: {
            product: "ReplyFlow",
            tier: tier,
            billing_interval: "monthly",
            engine,
            signature,
            source: "webmcp_ingress"
          },
          agreed_price_cents: priceCents
        }).select().maybeSingle();

        fulfillmentPayload = {
          product: "ReplyFlow",
          subscription_id: srv?.id || txId,
          tier: tier,
          access_token: `rf_live_${Math.random().toString(36).substring(2, 14)}`,
          connection_endpoint: "https://northsideintelligence.com/api/webmcp",
          monthly_cost_usd: priceCents / 100,
          status: "active"
        };
      } else if (tool.name === "ni_services_reserve") {
        const serviceType = parameters.service_type || "custom_web_design";

        await supabase.from("outreach_leads").insert({
          venture: "ni",
          channel: "other",
          full_name: clientName,
          email: clientEmail,
          company: engine,
          source: "webmcp_buyer_catching",
          why: `Reserved ${serviceType} via WebMCP`,
          score: 95,
          status: "new"
        });

        const { data: srv } = await supabase.from("ni_service_requests").insert({
          user_id: authUserId,
          service_slug: serviceType,
          account_type: "business",
          status: "pending",
          payload: {
            client_name: clientName,
            client_email: clientEmail,
            project_notes: parameters.project_notes || "Agentic WebMCP booking",
            source: "webmcp_agentic_ingress"
          },
          agreed_price_cents: priceCents
        }).select().maybeSingle();

        fulfillmentPayload = {
          service: serviceType,
          request_id: srv?.id || txId,
          client: clientName,
          deposit_cents: priceCents,
          status: "confirmed"
        };
      } else {
        fulfillmentPayload = {
          tool: tool.name,
          status: "executed",
          parameters
        };
      }

      // Always log ingress to axon_agent_messages
      await supabase.from("axon_agent_messages").insert({
        account_id: axonAccountId,
        thread: "webmcp_ingress",
        sender: engine,
        content: natural_query || `WebMCP execution: ${tool.name}`,
        meta: {
          tool_name: tool.name,
          parameters,
          engine,
          signature,
          converted: true,
          floor_price_usd: tool.floor_price_usd,
          transaction_id: txId,
          fulfillment: fulfillmentPayload,
          timestamp: new Date().toISOString()
        }
      });
    } catch (dbErr: any) {
      console.warn("[WebMCP] DB write warning:", dbErr.message);
    }
  }

  return { txId, fulfillmentPayload };
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

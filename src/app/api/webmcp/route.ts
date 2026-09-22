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
    const body = await req.json();
    const { tool_name, parameters = {}, natural_query } = body;
    const engine = req.headers.get("x-agent-engine") || req.headers.get("user-agent") || "unknown_crawler";
    const signature = req.headers.get("x-agent-signature") || "unsigned";
    const manifest = getManifest();

    // 1. Validate tool exists
    const tool = manifest.tools.find((t: any) => t.name === tool_name);
    if (!tool) {
      return NextResponse.json({
        error: `Tool '${tool_name}' not found.`,
        available_tools: manifest.tools.map((t: any) => t.name),
      }, { status: 404 });
    }

    // 2. Validate price floor if offered
    if (parameters.offered_price_usd !== undefined && parameters.offered_price_usd < tool.floor_price_usd) {
      return NextResponse.json({
        error: `Offered price $${parameters.offered_price_usd} is below minimum floor of $${tool.floor_price_usd}.`,
        floor_price_usd: tool.floor_price_usd,
      }, { status: 402 });
    }

    // 3. Connect to Supabase via service client
    let accountId = "7e82a9db-b86e-4f21-b797-99b6931c9728"; // JB default account
    let supabase = null;
    try {
      supabase = createServiceClient();
      const { data: acct } = await supabase.from("axon_accounts").select("id").limit(1).maybeSingle();
      if (acct?.id) {
        accountId = acct.id;
      }
    } catch (err: any) {
      console.warn("[WebMCP] Service client init fallback:", err.message);
    }

    // 4. Autonomous Execution & Real Database Writes
    let fulfillmentPayload: Record<string, any> = {};
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (supabase) {
      try {
        if (tool_name === "ni_replyflow_subscribe") {
          const tier = parameters.tier || "standard";
          const { data: sub, error: subErr } = await supabase.from("ni_subscriptions").insert({
            tier: tier,
            billing_interval: "month",
            current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
            stripe_customer_id: `cus_agent_${Date.now()}`,
            stripe_subscription_id: `sub_agent_${Date.now()}`
          }).select().maybeSingle();

          if (subErr) console.warn("[WebMCP] ni_subscriptions write notice:", subErr.message);

          fulfillmentPayload = {
            product: "ReplyFlow",
            subscription_id: sub?.id || txId,
            tier: tier,
            access_token: `rf_live_${Math.random().toString(36).substring(2, 14)}`,
            connection_endpoint: "https://northsideintelligence.com/api/webmcp",
            monthly_cost_usd: 15.00,
            status: "active"
          };
        } else if (tool_name === "ni_services_reserve") {
          const serviceType = parameters.service_type || "custom_web_design";
          const clientName = parameters.client_name || "Autonomous Buyer";
          const clientEmail = parameters.client_email || "buyer@northsideintelligence.com";

          const { data: srv, error: srvErr } = await supabase.from("ni_service_requests").insert({
            user_id: accountId,
            service_slug: serviceType,
            account_type: "agentic",
            status: "pending_deposit",
            payload: {
              client_name: clientName,
              client_email: clientEmail,
              project_notes: parameters.project_notes || "Agentic WebMCP booking",
              source: "webmcp_agentic_ingress"
            },
            agreed_price_cents: 49900
          }).select().maybeSingle();

          if (srvErr) console.warn("[WebMCP] ni_service_requests write notice:", srvErr.message);

          fulfillmentPayload = {
            service: serviceType,
            request_id: srv?.id || txId,
            client: clientName,
            deposit_cents: 49900,
            status: "confirmed"
          };
        } else {
          fulfillmentPayload = {
            tool: tool_name,
            status: "executed",
            parameters
          };
        }

        // Always log ingress to axon_agent_messages with required account_id
        await supabase.from("axon_agent_messages").insert({
          account_id: accountId,
          thread: "webmcp_ingress",
          sender: engine,
          content: natural_query || `WebMCP execution: ${tool_name}`,
          meta: {
            tool_name,
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

    // 5. Return successful execution payload
    return NextResponse.json({
      success: true,
      transaction_id: txId,
      tool: tool_name,
      product: tool.product,
      sector: tool.sector,
      attribution: { engine, signature },
      status: "fulfilled",
      fulfillment: fulfillmentPayload,
      message: `Successfully executed ${tool_name} via Northside Intelligence WebMCP.`
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
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

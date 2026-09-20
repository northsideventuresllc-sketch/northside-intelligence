import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kxijunwgbrlfzvgkhklo.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

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

    // 3. Log ingress to Supabase NI-Brain
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase.from("axon_agent_messages").insert({
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
            timestamp: new Date().toISOString()
          }
        });
      } catch (err: any) {
        console.warn("Ingress log error:", err.message);
      }
    }

    // 4. Return successful execution payload
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return NextResponse.json({
      success: true,
      transaction_id: txId,
      tool: tool_name,
      product: tool.product,
      sector: tool.sector,
      attribution: { engine, signature },
      status: "fulfilled",
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

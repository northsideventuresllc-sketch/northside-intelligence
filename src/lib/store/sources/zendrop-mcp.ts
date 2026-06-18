import "server-only";

const ZENDROP_MCP_URL = "https://app.zendrop.com/mcp/v1";

interface McpToolResult {
  content?: Array<{ type?: string; text?: string }>;
  structuredContent?: unknown;
  isError?: boolean;
}

export async function callZendropMcpTool<T = unknown>(
  toolName: string,
  args: Record<string, unknown>
): Promise<T | null> {
  const token = process.env.ZENDROP_API_KEY?.trim();
  if (!token) return null;

  try {
    const res = await fetch(ZENDROP_MCP_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args,
        },
      }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn("[store/zendrop] MCP call failed:", res.status, toolName);
      return null;
    }

    const json = (await res.json()) as {
      result?: McpToolResult;
      error?: { message?: string };
    };

    if (json.error) {
      console.warn("[store/zendrop] MCP error:", json.error.message ?? toolName);
      return null;
    }

    const result = json.result;
    if (result?.isError) return null;

    if (result?.structuredContent != null) {
      return result.structuredContent as T;
    }

    const textBlock = result?.content?.find((block) => block.text)?.text;
    if (textBlock) {
      try {
        return JSON.parse(textBlock) as T;
      } catch {
        return null;
      }
    }

    return null;
  } catch (err) {
    console.warn("[store/zendrop] MCP request error:", err);
    return null;
  }
}

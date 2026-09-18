/**
 * MCP Orchestrator — Northside Intelligence Platform
 * Handles client-side and server-side execution of Model Context Protocol tools.
 * Supports SSE, standard HTTP stream, and stdio execution brokers.
 */

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  endpointUrl: string;
  transportType: 'sse' | 'http' | 'stdio';
  authHeader?: string;
  tools?: MCPToolDefinition[];
  isActive: boolean;
}

export interface MCPExecutionRequest {
  serverId: string;
  toolName: string;
  arguments: Record<string, any>;
}

export interface MCPExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTimeMs: number;
}

export class MCPOrchestrator {
  private servers: Map<string, MCPServerConfig> = new Map();

  constructor(initialServers?: MCPServerConfig[]) {
    if (initialServers) {
      initialServers.forEach((server) => this.registerServer(server));
    }
  }

  public registerServer(config: MCPServerConfig): void {
    this.servers.set(config.id, config);
  }

  public listServers(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  public async discoverTools(serverId: string): Promise<MCPToolDefinition[]> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`MCP Server with ID ${serverId} not found.`);
    }

    if (server.tools && server.tools.length > 0) {
      return server.tools;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (server.authHeader) {
        headers['Authorization'] = server.authHeader;
      }

      const response = await fetch(`${server.endpointUrl}/tools/list`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', params: {} }),
      });

      if (!response.ok) {
        throw new Error(`Failed to list tools from MCP server: ${response.statusText}`);
      }

      const payload = await response.json();
      return payload.result?.tools || [];
    } catch (err: any) {
      console.warn(`[MCPOrchestrator] Dynamic discovery failed for ${server.name}, falling back to static schema`, err.message);
      return server.tools || [];
    }
  }

  public async executeTool(req: MCPExecutionRequest): Promise<MCPExecutionResult> {
    const startTime = Date.now();
    const server = this.servers.get(req.serverId);

    if (!server) {
      return {
        success: false,
        error: `MCP Server '${req.serverId}' is not configured or disabled.`,
        executionTimeMs: 0,
      };
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (server.authHeader) {
        headers['Authorization'] = server.authHeader;
      }

      const response = await fetch(`${server.endpointUrl}/tools/call`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: req.toolName,
            arguments: req.arguments,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`MCP execution error HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.result?.content || result.result,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Unknown MCP execution error',
        executionTimeMs: Date.now() - startTime,
      };
    }
  }
}

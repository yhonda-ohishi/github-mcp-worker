import type { Context } from "hono";
import type { Env, MCPRequest, MCPResponse, MCPTool } from "../types";
import * as jose from "jose";
import { tools, executeTool } from "./tools";

// Extract and verify JWT token
async function getGitHubToken(c: Context<{ Bindings: Env }>): Promise<string | null> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const secret = new TextEncoder().encode(c.env.JWT_SECRET);

  try {
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: c.env.SERVER_URL,
    });
    return payload.github_token as string;
  } catch {
    return null;
  }
}

// MCP protocol version
const MCP_VERSION = "2024-11-05";

export const handleMCP = async (c: Context<{ Bindings: Env }>) => {
  const githubToken = await getGitHubToken(c);

  if (!githubToken) {
    c.header("WWW-Authenticate", `Bearer resource="${c.env.SERVER_URL}"`);
    return c.json({ error: "unauthorized" }, 401);
  }

  const request = await c.req.json() as MCPRequest;

  if (request.jsonrpc !== "2.0") {
    return c.json({
      jsonrpc: "2.0",
      id: request.id,
      error: { code: -32600, message: "Invalid Request" },
    } as MCPResponse);
  }

  let result: unknown;

  switch (request.method) {
    case "initialize":
      result = {
        protocolVersion: MCP_VERSION,
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "github-mcp-server",
          version: "1.0.0",
        },
      };
      break;

    case "notifications/initialized":
      // No response needed for notifications
      return c.json({ jsonrpc: "2.0", id: request.id, result: {} });

    case "tools/list":
      result = {
        tools: tools.map((tool: MCPTool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
      break;

    case "tools/call":
      const toolName = (request.params as { name: string })?.name;
      const toolArgs = (request.params as { arguments?: Record<string, unknown> })?.arguments || {};

      const tool = tools.find((t: MCPTool) => t.name === toolName);
      if (!tool) {
        return c.json({
          jsonrpc: "2.0",
          id: request.id,
          error: { code: -32602, message: `Unknown tool: ${toolName}` },
        } as MCPResponse);
      }

      try {
        const toolResult = await executeTool(toolName, toolArgs, githubToken);
        result = {
          content: [
            {
              type: "text",
              text: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult, null, 2),
            },
          ],
        };
      } catch (error) {
        result = {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
      break;

    default:
      return c.json({
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32601, message: `Method not found: ${request.method}` },
      } as MCPResponse);
  }

  return c.json({
    jsonrpc: "2.0",
    id: request.id,
    result,
  } as MCPResponse);
};

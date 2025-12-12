import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";

// OAuth endpoints
import { getProtectedResourceMetadata, getAuthorizationServerMetadata } from "./oauth/metadata";
import { handleAuthorize } from "./oauth/authorize";
import { handleCallback } from "./oauth/callback";
import { handleToken } from "./oauth/token";

// MCP endpoint
import { handleMCP } from "./mcp/handler";

const app = new Hono<{ Bindings: Env }>();

// CORS for MCP clients
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "MCP-Protocol-Version"],
  exposeHeaders: ["WWW-Authenticate"],
}));

// Health check
app.get("/", (c) => {
  return c.json({
    name: "GitHub MCP Server",
    version: "1.0.0",
    status: "ok",
  });
});

// OAuth 2.0 Discovery endpoints (RFC 9728 / RFC 8414)
app.get("/.well-known/oauth-protected-resource", getProtectedResourceMetadata);
app.get("/.well-known/oauth-authorization-server", getAuthorizationServerMetadata);

// OAuth 2.0 endpoints
app.get("/oauth/authorize", handleAuthorize);
app.get("/oauth/callback", handleCallback);
app.post("/oauth/token", handleToken);

// Dynamic Client Registration (simplified - accepts any client)
app.post("/oauth/register", async (c) => {
  const body = await c.req.json();
  const clientId = crypto.randomUUID();
  
  return c.json({
    client_id: clientId,
    client_name: body.client_name || "MCP Client",
    redirect_uris: body.redirect_uris || [],
    grant_types: ["authorization_code"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  });
});

// MCP endpoint
app.post("/mcp", handleMCP);

// SSE endpoint for streaming (if needed in future)
app.get("/mcp/sse", (c) => {
  return c.json({ error: "SSE not implemented, use POST /mcp" }, 501);
});

// Documentation
app.get("/docs", (c) => {
  const serverUrl = c.env.SERVER_URL;
  
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>GitHub MCP Server</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
        pre { background: #f0f0f0; padding: 16px; border-radius: 8px; overflow-x: auto; }
        h1, h2 { color: #333; }
      </style>
    </head>
    <body>
      <h1>GitHub MCP Server</h1>
      <p>A Model Context Protocol server for GitHub API integration.</p>
      
      <h2>Integration with Claude.ai</h2>
      <ol>
        <li>Go to Claude.ai Settings → Integrations</li>
        <li>Click "Add Integration"</li>
        <li>Enter name: <code>GitHub</code></li>
        <li>Enter URL: <code>${serverUrl}</code></li>
        <li>Click "Connect" and authorize with GitHub</li>
      </ol>
      
      <h2>Available Tools</h2>
      <ul>
        <li><strong>list_repos</strong> - List your repositories</li>
        <li><strong>get_repo</strong> - Get repository details</li>
        <li><strong>create_repo</strong> - Create a new repository</li>
        <li><strong>get_contents</strong> - Get file/directory contents</li>
        <li><strong>get_file_content</strong> - Get decoded file content</li>
        <li><strong>create_or_update_file</strong> - Create or update a file</li>
        <li><strong>list_issues</strong> - List repository issues</li>
        <li><strong>get_issue</strong> - Get issue details</li>
        <li><strong>create_issue</strong> - Create a new issue</li>
        <li><strong>update_issue</strong> - Update an issue</li>
        <li><strong>list_branches</strong> - List branches</li>
        <li><strong>search_repos</strong> - Search repositories</li>
        <li><strong>search_code</strong> - Search code</li>
      </ul>
      
      <h2>API Endpoints</h2>
      <ul>
        <li><code>GET /.well-known/oauth-protected-resource</code> - Resource metadata</li>
        <li><code>GET /.well-known/oauth-authorization-server</code> - Auth server metadata</li>
        <li><code>GET /oauth/authorize</code> - Start OAuth flow</li>
        <li><code>GET /oauth/callback</code> - OAuth callback</li>
        <li><code>POST /oauth/token</code> - Exchange code for token</li>
        <li><code>POST /oauth/register</code> - Dynamic client registration</li>
        <li><code>POST /mcp</code> - MCP JSON-RPC endpoint</li>
      </ul>
    </body>
    </html>
  `);
});

export default app;

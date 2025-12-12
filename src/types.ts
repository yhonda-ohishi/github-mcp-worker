export interface Env {
  // KV Namespace for sessions
  SESSIONS: KVNamespace;

  // GitHub OAuth App credentials
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;

  // JWT signing secret
  JWT_SECRET: string;

  // Server URL (e.g., https://github-mcp-server.your-account.workers.dev)
  SERVER_URL: string;

  // OAuth scopes (default: repo,read:user)
  OAUTH_SCOPES: string;
}

export interface SessionData {
  state: string;
  codeVerifier: string;
  clientId: string;
  redirectUri: string;
  createdAt: number;
}

export interface TokenData {
  accessToken: string;
  githubToken: string;
  createdAt: number;
  expiresAt: number;
}

export interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

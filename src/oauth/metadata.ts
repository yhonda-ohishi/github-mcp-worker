import type { Context } from "hono";
import type { Env } from "../types";

// RFC 9728 - OAuth 2.0 Protected Resource Metadata
export const getProtectedResourceMetadata = (c: Context<{ Bindings: Env }>) => {
  const serverUrl = c.env.SERVER_URL;

  return c.json({
    resource: serverUrl,
    authorization_servers: [serverUrl],
    scopes_supported: ["mcp:tools"],
    bearer_methods_supported: ["header"],
  });
};

// RFC 8414 - OAuth 2.0 Authorization Server Metadata
export const getAuthorizationServerMetadata = (c: Context<{ Bindings: Env }>) => {
  const serverUrl = c.env.SERVER_URL;

  return c.json({
    issuer: serverUrl,
    authorization_endpoint: `${serverUrl}/oauth/authorize`,
    token_endpoint: `${serverUrl}/oauth/token`,
    registration_endpoint: `${serverUrl}/oauth/register`,
    scopes_supported: ["mcp:tools"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    service_documentation: `${serverUrl}/docs`,
  });
};

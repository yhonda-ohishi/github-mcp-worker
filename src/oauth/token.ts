import type { Context } from "hono";
import type { Env } from "../types";
import * as jose from "jose";

// SHA-256 hash for PKCE verification
async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(hash);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const handleToken = async (c: Context<{ Bindings: Env }>) => {
  const contentType = c.req.header("content-type") || "";

  let grantType: string | undefined;
  let code: string | undefined;
  let codeVerifier: string | undefined;
  let clientId: string | undefined;
  let redirectUri: string | undefined;

  if (contentType.includes("application/json")) {
    const body = await c.req.json() as Record<string, string>;
    grantType = body.grant_type;
    code = body.code;
    codeVerifier = body.code_verifier;
    clientId = body.client_id;
    redirectUri = body.redirect_uri;
  } else {
    const body = await c.req.parseBody();
    grantType = body.grant_type as string;
    code = body.code as string;
    codeVerifier = body.code_verifier as string;
    clientId = body.client_id as string;
    redirectUri = body.redirect_uri as string;
  }

  if (grantType !== "authorization_code") {
    return c.json({ error: "unsupported_grant_type" }, 400);
  }

  if (!code || !codeVerifier) {
    return c.json({ error: "invalid_request", error_description: "Missing code or code_verifier" }, 400);
  }

  // Retrieve code data
  const codeDataStr = await c.env.SESSIONS.get(`code:${code}`);
  if (!codeDataStr) {
    return c.json({ error: "invalid_grant", error_description: "Code not found or expired" }, 400);
  }

  const codeData = JSON.parse(codeDataStr) as {
    githubToken: string;
    sessionId: string;
    clientId: string;
    redirectUri: string;
    codeVerifier: string;
    createdAt: number;
  };

  // Verify PKCE code_verifier
  const expectedChallenge = await sha256(codeVerifier);
  if (expectedChallenge !== codeData.codeVerifier) {
    return c.json({ error: "invalid_grant", error_description: "Invalid code_verifier" }, 400);
  }

  // Clean up authorization code
  await c.env.SESSIONS.delete(`code:${code}`);

  // Generate JWT access token
  const secret = new TextEncoder().encode(c.env.JWT_SECRET);
  const expiresIn = 3600; // 1 hour

  const accessToken = await new jose.SignJWT({
    sub: crypto.randomUUID(),
    github_token: codeData.githubToken,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(c.env.SERVER_URL)
    .setExpirationTime(`${expiresIn}s`)
    .sign(secret);

  return c.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: expiresIn,
    scope: "mcp:tools",
  });
};

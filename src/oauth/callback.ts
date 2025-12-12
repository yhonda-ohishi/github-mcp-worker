import type { Context } from "hono";
import type { Env, SessionData } from "../types";

export const handleCallback = async (c: Context<{ Bindings: Env }>) => {
  const code = c.req.query("code");
  const sessionId = c.req.query("state");
  const error = c.req.query("error");

  if (error) {
    return c.json({ error, error_description: c.req.query("error_description") }, 400);
  }

  if (!code || !sessionId) {
    return c.json({ error: "invalid_request", error_description: "Missing code or state" }, 400);
  }

  // Retrieve session data
  const sessionDataStr = await c.env.SESSIONS.get(`session:${sessionId}`);
  if (!sessionDataStr) {
    return c.json({ error: "invalid_request", error_description: "Session not found or expired" }, 400);
  }

  const sessionData: SessionData = JSON.parse(sessionDataStr);

  // Exchange code for GitHub access token
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      client_id: c.env.GITHUB_CLIENT_ID,
      client_secret: c.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenResponse.json() as { access_token?: string; error?: string; error_description?: string };

  if (tokenData.error || !tokenData.access_token) {
    return c.json({
      error: tokenData.error || "token_error",
      error_description: tokenData.error_description || "Failed to get access token"
    }, 400);
  }

  // Generate authorization code for our OAuth flow
  const authCode = crypto.randomUUID();

  // Store the GitHub token with the auth code
  await c.env.SESSIONS.put(`code:${authCode}`, JSON.stringify({
    githubToken: tokenData.access_token,
    sessionId,
    clientId: sessionData.clientId,
    redirectUri: sessionData.redirectUri,
    codeVerifier: sessionData.codeVerifier,
    createdAt: Date.now(),
  }), {
    expirationTtl: 300, // 5 minutes
  });

  // Clean up session
  await c.env.SESSIONS.delete(`session:${sessionId}`);

  // Redirect back to client with authorization code
  const redirectUrl = new URL(sessionData.redirectUri);
  redirectUrl.searchParams.set("code", authCode);
  redirectUrl.searchParams.set("state", sessionData.state);

  return c.redirect(redirectUrl.toString());
};

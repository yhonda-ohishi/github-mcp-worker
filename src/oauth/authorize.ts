import type { Context } from "hono";
import type { Env, SessionData } from "../types";

export const handleAuthorize = async (c: Context<{ Bindings: Env }>) => {
  const clientId = c.req.query("client_id");
  const redirectUri = c.req.query("redirect_uri");
  const state = c.req.query("state");
  const codeChallenge = c.req.query("code_challenge");
  const codeChallengeMethod = c.req.query("code_challenge_method");

  // Validate required parameters
  if (!clientId || !redirectUri || !state || !codeChallenge) {
    return c.json({ error: "invalid_request", error_description: "Missing required parameters" }, 400);
  }

  if (codeChallengeMethod && codeChallengeMethod !== "S256") {
    return c.json({ error: "invalid_request", error_description: "Only S256 code_challenge_method is supported" }, 400);
  }

  // Generate session ID
  const sessionId = crypto.randomUUID();

  // Store session data
  const sessionData: SessionData = {
    state,
    codeVerifier: codeChallenge, // Store code_challenge for later verification
    clientId,
    redirectUri,
    createdAt: Date.now(),
  };

  await c.env.SESSIONS.put(`session:${sessionId}`, JSON.stringify(sessionData), {
    expirationTtl: 600, // 10 minutes
  });

  // Build GitHub OAuth URL
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", c.env.GITHUB_CLIENT_ID);
  githubAuthUrl.searchParams.set("redirect_uri", `${c.env.SERVER_URL}/oauth/callback`);
  githubAuthUrl.searchParams.set("scope", c.env.OAUTH_SCOPES || "repo,read:user");
  githubAuthUrl.searchParams.set("state", sessionId);

  return c.redirect(githubAuthUrl.toString());
};

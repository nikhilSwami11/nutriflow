import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** A server-side client that acts as the person who owns `token`: row level security scopes every query to them. */
export const clientForToken = (url: string, anonKey: string, token: string): SupabaseClient =>
  createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

export interface VerifiedToken {
  userId: string;
  /** The OAuth app (ChatGPT, Claude) the token was issued to; empty for a normal app session. */
  clientId: string;
  scopes: string[];
  expiresAt?: number;
}

// A checked token is trusted for a minute (never past its expiry): the check costs a round trip to Supabase Auth on every
// chat tool call otherwise. shortcut: a token revoked within that minute still works until it runs out; drop the cache if
// instant revocation matters.
const TRUST_MS = 60_000;
const MAX_CACHED = 500;
const checked = new Map<string, { v: VerifiedToken; until: number }>();

/** Checks a Supabase access token (signature and expiry). Null when it is not valid. */
export async function verifyAccessToken(url: string, anonKey: string, token: string): Promise<VerifiedToken | null> {
  const now = Date.now();
  const hit = checked.get(token);
  if (hit && hit.until > now) return hit.v;
  const v = await check(url, anonKey, token);
  if (v) {
    if (checked.size >= MAX_CACHED) checked.clear();
    checked.set(token, { v, until: Math.min(now + TRUST_MS, v.expiresAt ? v.expiresAt * 1000 : now + TRUST_MS) });
  }
  return v;
}

async function check(url: string, anonKey: string, token: string): Promise<VerifiedToken | null> {
  const { data, error } = await clientForToken(url, anonKey, token).auth.getClaims(token);
  const c = data?.claims;
  if (error || !c?.sub) return null;
  return {
    userId: c.sub,
    clientId: typeof c.client_id === "string" ? c.client_id : "",
    scopes: typeof c.scope === "string" ? c.scope.split(" ").filter(Boolean) : [],
    expiresAt: typeof c.exp === "number" ? c.exp : undefined,
  };
}

// Cloudflare Pages Function: GET/PUT /api/sync. Single-owner personal dashboard.
async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
async function authorized(request, env) {
  if (!env.SESSION_SECRET) return false;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)allmoney_session=([^;]+)/);
  if (!match) return false;
  let token;
  try { token = decodeURIComponent(match[1]); } catch { return false; }
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const expiry = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!/^\d+$/.test(expiry) || Number(expiry) < Math.floor(Date.now() / 1000)) return false;
  return signature === await hmac(env.SESSION_SECRET, expiry);
}
export async function onRequestGet({ request, env }) {
  if (!(await authorized(request, env))) return json({ error: "Sign in required." }, 401);
  if (!env.DB) return json({ error: "Cloudflare D1 binding DB is missing." }, 503);
  try {
    const row = await env.DB.prepare("SELECT payload, updated_at FROM app_state WHERE id = 1").first();
    if (!row) return json({ state: null, updatedAt: null });
    return json({ state: JSON.parse(row.payload), updatedAt: row.updated_at });
  } catch (e) {
    return json({ error: "Database read failed. Check that the D1 migration was applied." }, 500);
  }
}
export async function onRequestPut({ request, env }) {
  if (!(await authorized(request, env))) return json({ error: "Sign in required." }, 401);
  if (!env.DB) return json({ error: "Cloudflare D1 binding DB is missing." }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
  if (!body || typeof body.state !== "object" || body.state === null || Array.isArray(body.state)) {
    return json({ error: "State payload must be an object." }, 400);
  }
  const allowed = new Set([
    "allmoney_imports", "allmoney_budgets", "allmoney_investments_v1",
    "allmoney_investment_fx", "allmoney_investment_target_v1"
  ]);
  const state = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body.state, key)) state[key] = body.state[key];
  }
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(
      "INSERT INTO app_state (id, payload, updated_at) VALUES (1, ?, ?) " +
      "ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at"
    ).bind(JSON.stringify(state), now).run();
    return json({ ok: true, updatedAt: now });
  } catch (e) {
    return json({ error: "Database save failed. Check the D1 migration and binding." }, 500);
  }
}

import { json, getSessionUser } from "../_lib/auth.js";
const ALLOWED = new Set([
  "allmoney_imports", "allmoney_budgets", "allmoney_investments_v1",
  "allmoney_investment_fx", "allmoney_investment_target_v1"
]);
export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: "Sign in required." }, 401);
  try {
    const row = await env.DB.prepare("SELECT payload, updated_at FROM user_app_state WHERE user_id = ?").bind(user.id).first();
    if (!row) return json({ state: null, updatedAt: null, account: { email: user.email, name: user.display_name } });
    return json({ state: JSON.parse(row.payload), updatedAt: row.updated_at, account: { email: user.email, name: user.display_name } });
  } catch {
    return json({ error: "Database read failed. Confirm the account migration was applied." }, 500);
  }
}
export async function onRequestPut({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: "Sign in required." }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
  if (!body || typeof body.state !== "object" || body.state === null || Array.isArray(body.state)) {
    return json({ error: "State payload must be an object." }, 400);
  }
  const state = {};
  for (const key of ALLOWED) if (Object.prototype.hasOwnProperty.call(body.state, key)) state[key] = body.state[key];
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(
      "INSERT INTO user_app_state (user_id, payload, updated_at) VALUES (?, ?, ?) " +
      "ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at"
    ).bind(user.id, JSON.stringify(state), now).run();
    return json({ ok: true, updatedAt: now });
  } catch {
    return json({ error: "Database save failed. Confirm the account migration was applied." }, 500);
  }
}

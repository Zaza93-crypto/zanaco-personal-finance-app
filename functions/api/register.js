import { json, hashPassword, createSession } from "../_lib/auth.js";
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "Cloudflare D1 binding DB is missing." }, 503);
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) return json({ error: "Configure SESSION_SECRET with at least 32 random characters in Cloudflare Pages." }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const displayName = String(body.name || "").trim().slice(0, 80);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (displayName.length < 2) return json({ error: "Enter your name (at least 2 characters)." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json({ error: "Enter a valid email address." }, 400);
  if (password.length < 10 || password.length > 128) return json({ error: "Use a password of 10 to 128 characters." }, 400);
  try {
    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) return json({ error: "An account with that email already exists. Sign in instead." }, 409);
    const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM users").first();
    const isFirstUser = Number(count?.total || 0) === 0;
    const id = crypto.randomUUID();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltText = btoa(String.fromCharCode(...salt));
    const passwordHash = await hashPassword(password, salt);
    await env.DB.prepare("INSERT INTO users (id, email, display_name, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, email, displayName, passwordHash, saltText, new Date().toISOString()).run();

    // Preserve the current shared dashboard state for the first registered account.
    // New accounts start with an empty, private state.
    if (isFirstUser) {
      try {
        const legacy = await env.DB.prepare("SELECT payload FROM app_state WHERE id = 1").first();
        if (legacy?.payload) {
          await env.DB.prepare("INSERT OR IGNORE INTO user_app_state (user_id, payload, updated_at) VALUES (?, ?, ?)")
            .bind(id, legacy.payload, new Date().toISOString()).run();
        }
      } catch (_) { /* A fresh D1 database may not have the legacy table. */ }
    }
    const cookie = await createSession(id, env);
    return json({ ok: true, email, name: displayName }, 201, { "set-cookie": cookie });
  } catch (e) {
    if (String(e).includes("UNIQUE")) return json({ error: "An account with that email already exists." }, 409);
    return json({ error: "Account creation failed. Confirm the account migration was applied in Cloudflare D1." }, 500);
  }
}

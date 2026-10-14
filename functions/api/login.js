import { json, fromB64url, hashPassword, createSession } from "../_lib/auth.js";
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "Cloudflare D1 binding DB is missing." }, 503);
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) return json({ error: "Configure SESSION_SECRET with at least 32 random characters in Cloudflare Pages." }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (email.length > 254 || password.length > 128) return json({ error: "Invalid email or password." }, 401);
  try {
    const user = await env.DB.prepare("SELECT id, email, display_name, password_hash, password_salt FROM users WHERE email = ?").bind(email).first();
    if (!user) return json({ error: "Email or password is incorrect." }, 401);
    const calculated = await hashPassword(password, fromB64url(user.password_salt));
    if (calculated !== user.password_hash) return json({ error: "Email or password is incorrect." }, 401);
    const cookie = await createSession(user.id, env);
    return json({ ok: true, email: user.email, name: user.display_name }, 200, { "set-cookie": cookie });
  } catch (e) {
    return json({ error: "Sign-in failed. Confirm the account migration was applied in Cloudflare D1." }, 500);
  }
}

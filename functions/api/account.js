import { json, getSessionUser } from "../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: "Sign in required." }, 401);
  return json({ ok: true, profile: { name: user.display_name || "", email: user.email || "" } });
}

export async function onRequestPatch({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: "Sign in required." }, 401);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Invalid request body." }, 400); }

  const name = String(body.name || "").trim().slice(0, 80);
  const email = String(body.email || "").trim().toLowerCase();

  if (name.length < 2) return json({ error: "Name must contain at least 2 characters." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return json({ error: "Enter a valid email address." }, 400);
  }

  try {
    await env.DB.prepare("UPDATE users SET display_name = ?, email = ? WHERE id = ?")
      .bind(name, email, user.id).run();
    return json({ ok: true, profile: { name, email } });
  } catch (error) {
    const message = String(error?.message || "");
    if (message.includes("UNIQUE")) return json({ error: "That email address is already used by another account." }, 409);
    return json({ error: "Could not save profile. Please try again." }, 500);
  }
}

import { json, getSessionUser, fromB64url, hashPassword } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ error: "Sign in required." }, 401);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Invalid request body." }, 400); }

  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  if (newPassword.length < 10 || newPassword.length > 128) {
    return json({ error: "Your new password must be 10–128 characters long." }, 400);
  }
  if (currentPassword === newPassword) {
    return json({ error: "Choose a new password different from your current password." }, 400);
  }

  try {
    const stored = await env.DB.prepare(
      "SELECT password_hash, password_salt FROM users WHERE id = ?"
    ).bind(user.id).first();
    if (!stored) return json({ error: "Account not found." }, 404);

    const verified = await hashPassword(currentPassword, fromB64url(stored.password_salt));
    if (verified !== stored.password_hash) {
      return json({ error: "Your current password is incorrect." }, 400);
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltText = btoa(String.fromCharCode(...salt));
    const passwordHash = await hashPassword(newPassword, salt);
    await env.DB.prepare("UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?")
      .bind(passwordHash, saltText, user.id).run();

    return json({ ok: true, message: "Password updated successfully." });
  } catch {
    return json({ error: "Could not update password. Please try again." }, 500);
  }
}

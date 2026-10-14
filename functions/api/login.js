// Cloudflare Pages Function: POST /api/login
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export async function onRequestPost({ request, env }) {
  if (!env.APP_PASSWORD || !env.SESSION_SECRET) {
    return json({ error: "Cloudflare secrets APP_PASSWORD and SESSION_SECRET must be configured." }, 503);
  }
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const supplied = String(body.password || "");
  if (supplied.length > 512 || supplied !== env.APP_PASSWORD) {
    return json({ error: "Incorrect password." }, 401);
  }
  const expiry = String(Math.floor(Date.now() / 1000) + 8 * 60 * 60);
  const token = expiry + "." + await hmac(env.SESSION_SECRET, expiry);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "set-cookie": `allmoney_session=${token}; Path=/; Max-Age=28800; HttpOnly; Secure; SameSite=Strict`
    }
  });
}

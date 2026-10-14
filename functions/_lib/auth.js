export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });
}

export function b64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function hmac(secret, value) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

export async function hashPassword(password, saltBytes) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: 210000, hash: "SHA-256" },
    material, 256
  );
  return b64url(bits);
}

export function fromB64url(value) {
  const s = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = s + "=".repeat((4 - s.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

export async function createSession(userId, env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 10) {
    throw new Error("SESSION_SECRET must contain at least 10 characters.");
  }
  const expiry = String(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30);
  const payload = `${userId}.${expiry}`;
  const token = `${payload}.${await hmac(env.SESSION_SECRET, payload)}`;
  return `allmoney_session=${token}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`;
}

export async function getSessionUser(request, env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 10 || !env.DB) return null;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)allmoney_session=([^;]+)/);
  if (!match) return null;
  const parts = match[1].split(".");
  if (parts.length !== 3) return null;
  const [userId, expiry, signature] = parts;
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !/^\d+$/.test(expiry) ||
      Number(expiry) < Math.floor(Date.now() / 1000)) return null;
  if (signature !== await hmac(env.SESSION_SECRET, `${userId}.${expiry}`)) return null;
  try {
    return await env.DB.prepare("SELECT id, email, display_name FROM users WHERE id = ?").bind(userId).first();
  } catch {
    return null;
  }
}

export function sessionCookieClear() {
  return "allmoney_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax";
}

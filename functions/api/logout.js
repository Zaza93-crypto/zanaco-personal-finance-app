// Cloudflare Pages Function: POST /api/logout
export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "set-cookie": "allmoney_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict"
    }
  });
}

// Cloudflare Pages middleware: one entry URL, session gate, logout and cloud sync.
import { getSessionUser } from "./_lib/auth.js";

const DASHBOARD_PAGES = new Set(["/", "/index.html", "/budget.html", "/investment.html", "/tracker.html"]);
const INJECTED_SCRIPTS = [
  '<script defer src="/logout.js?v=20261015-fix1"></script>',
  '<script defer src="/cloud-sync.js?v=20261015-fix1"></script>'
].join("\n");

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (!DASHBOARD_PAGES.has(url.pathname) || context.request.method !== "GET") return context.next();

  // The main website URL is the entry point: send signed-out visitors to login.
  const user = await getSessionUser(context.request, context.env);
  if (!user) {
    const next = url.pathname + url.search;
    return Response.redirect(new URL("/login.html?next=" + encodeURIComponent(next), url), 302);
  }

  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.includes("text/html")) return response;

  let html = await response.text();
  if (!html.includes('src="/logout.js?v=20261015-fix1"')) {
    const scripts = INJECTED_SCRIPTS + "\n";
    if (/<\/body\s*>/i.test(html)) html = html.replace(/<\/body\s*>/i, scripts + "</body>");
    else html += scripts;
  }
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("cache-control", "no-store");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

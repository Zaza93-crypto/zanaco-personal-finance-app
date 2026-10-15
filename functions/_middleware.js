// Cloudflare Pages middleware: shared theme, logout button and cloud sync injection.
const DASHBOARD_PAGES = new Set(["/", "/index.html", "/budget.html", "/investment.html", "/tracker.html"]);

const INJECTED_ASSETS = [
  '<link rel="stylesheet" href="/unified-theme.css?v=20261015-fix1">',
  '<script defer src="/logout.js?v=20261015-fix1"></script>',
  '<script defer src="/cloud-sync.js?v=20261015-fix1"></script>',
  `<script>
  (function () {
    fetch('/api/sync', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (response) {
        if (response.status === 401) {
          location.replace('/login.html?next=' + encodeURIComponent(location.pathname + location.search));
        }
      })
      .catch(function () {});
  })();
  </script>`
].join("\n");

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (!DASHBOARD_PAGES.has(url.pathname) || context.request.method !== "GET") {
    return context.next();
  }

  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.includes("text/html")) return response;

  let html = await response.text();
  if (!html.includes('href="/unified-theme.css?v=20261015-fix1"')) {
    if (/<\/head\s*>/i.test(html)) {
      html = html.replace(/<\/head\s*>/i, INJECTED_ASSETS + "\n</head>");
    } else {
      html = INJECTED_ASSETS + "\n" + html;
    }
  }

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("cache-control", "no-store");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

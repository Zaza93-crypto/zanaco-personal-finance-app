// Cloudflare Pages middleware: apply the correct page theme and preserve sync/logout.
const THEME_BY_PATH = {
  "/": "/overview-theme.css?v=20261016-fix1",
  "/index.html": "/overview-theme.css?v=20261016-fix1",
  "/budget.html": "/budget-theme.css?v=20261016-fix1",
  "/investment.html": "/investment-theme.css?v=20261016-fix1",
  "/tracker.html": "/overview-theme.css?v=20261016-fix1"
};

const DASHBOARD_PAGES = new Set(Object.keys(THEME_BY_PATH));

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (!DASHBOARD_PAGES.has(url.pathname) || context.request.method !== "GET") {
    return context.next();
  }

  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.includes("text/html")) return response;

  let html = await response.text();
  const themeHref = THEME_BY_PATH[url.pathname];

  // Remove the obsolete stylesheet and replace any previous per-page theme link.
  html = html.replace(
    /<link\b[^>]*href=["']\/unified-theme\.css(?:\?[^"']*)?["'][^>]*>\s*/gi,
    ""
  );

  const themePattern = /<link\b[^>]*href=["']\/(?:overview|budget|investment)-theme\.css(?:\?[^"']*)?["'][^>]*>\s*/i;
  const themeLink = `<link rel="stylesheet" href="${themeHref}">`;

  if (themePattern.test(html)) {
    html = html.replace(themePattern, themeLink + "\n");
  } else if (/<\/head\s*>/i.test(html)) {
    html = html.replace(/<\/head\s*>/i, themeLink + "\n</head>");
  } else {
    html = themeLink + "\n" + html;
  }

  // Preserve the existing logout and cross-device sync behavior without duplicating scripts.
  const additions = [];
  if (!/src=["']\/logout\.js(?:\?[^"']*)?["']/i.test(html)) {
    additions.push('<script defer src="/logout.js?v=20261016-fix1"></script>');
  }
  if (!/src=["']\/cloud-sync\.js(?:\?[^"']*)?["']/i.test(html)) {
    additions.push('<script defer src="/cloud-sync.js?v=20261016-fix1"></script>');
  }
  if (!html.includes("fetch('/api/sync'")) {
    additions.push(`<script>
      (function () {
        fetch('/api/sync', { credentials: 'same-origin', cache: 'no-store' })
          .then(function (response) {
            if (response.status === 401) {
              location.replace('/login.html?next=' + encodeURIComponent(location.pathname + location.search));
            }
          })
          .catch(function () {});
      })();
    </script>`);
  }

  if (additions.length && /<\/head\s*>/i.test(html)) {
    html = html.replace(/<\/head\s*>/i, additions.join("\n") + "\n</head>");
  } else if (additions.length) {
    html = additions.join("\n") + "\n" + html;
  }

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("cache-control", "no-store");
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

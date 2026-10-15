// Cloudflare Pages middleware: login gate, logout button, and cloud sync.
// Keeps the existing four dashboard pages and API routes intact.
const DASHBOARD_PAGES = new Set(["/", "/index.html", "/budget.html", "/investment.html", "/tracker.html"]);

const INJECTED_SCRIPTS = [
  '<script defer src="/logout.js?v=20261015"></script>',
  '<script defer src="/cloud-sync.js?v=20261015"></script>',
  `<script>
  (function () {
    fetch('/api/sync', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (response) {
        if (response.status === 401) {
          location.replace('/login.html?next=' + encodeURIComponent(location.pathname));
        }
      })
      .catch(function () {
        // Do not redirect on a temporary network error.
      });
  })();
  </script>`
].join('\\n');

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (!DASHBOARD_PAGES.has(url.pathname) || context.request.method !== 'GET') {
    return context.next();
  }

  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || !contentType.includes('text/html')) return response;

  let html = await response.text();
  if (!html.includes('src="/logout.js?v=20261015"')) {
    if (/<\/body\s*>/i.test(html)) {
      html = html.replace(/<\/body\s*>/i, INJECTED_SCRIPTS + '\\n</body>');
    } else {
      html += INJECTED_SCRIPTS;
    }
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

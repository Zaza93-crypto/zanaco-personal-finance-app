// Cloudflare Pages middleware: single website URL + cross-device sync.
// Preserves all existing dashboard HTML and API routes.
const PAGES = new Set(["/", "/index.html", "/budget.html", "/investment.html", "/tracker.html"]);
const GATE = `<script>
(function () {
  // Require login before allowing access to dashboard pages.
  fetch('/api/sync', {credentials:'same-origin', cache:'no-store'})
    .then(function(r) {
      if (r.status === 401) {
        location.replace('/login.html?next=' + encodeURIComponent(location.pathname));
      }
    })
    .catch(function() { /* Keep page usable if temporarily offline. */ });
})();
</script>`;
const SYNC = `<script defer src="/cloud-sync.js?v=20261015"></script>`;

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  // Do not modify API calls, authentication, scripts, or other static files.
  if (!PAGES.has(path) || context.request.method !== 'GET') {
    return context.next();
  }
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || !contentType.includes('text/html')) return response;

  let html = await response.text();
  // Avoid double injection if middleware executes more than once.
  if (!html.includes('src="/cloud-sync.js?v=20261015"')) {
    const injection = GATE + '\n' + SYNC;
    if (/<\/body\s*>/i.test(html)) {
      html = html.replace(/<\/body\s*>/i, injection + '\n</body>');
    } else {
      html += injection;
    }
  }
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-store');
  return new Response(html, {status:response.status, statusText:response.statusText, headers});
}

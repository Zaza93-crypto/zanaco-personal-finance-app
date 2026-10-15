ALL MONEY / ZANACO PERSONAL FINANCE — UNIFIED DESIGN UPDATE

This package applies one shared visual theme across the four existing dashboard pages:
- index.html
- budget.html
- investment.html
- tracker.html

The design follows the chosen landing page: warm white surfaces, coral/pink/purple gradients, rounded cards, consistent controls and mobile-friendly navigation.

ZIP contents:
- unified-theme.css
- functions/_middleware.js
- README.txt

MANUAL UPLOAD
1. Extract the ZIP.
2. Upload unified-theme.css to the repository root.
3. Replace functions/_middleware.js with the included file.
4. Keep index.html, budget.html, investment.html, tracker.html, login.html, cloud-sync.js, logout.js, all API functions, migrations and wrangler.toml unchanged.
5. Commit the two file changes to the branch connected to Cloudflare Pages.
6. Wait for deployment, then open each of the four pages and check the shared theme.

IMPORTANT
The middleware injects the shared stylesheet and the existing logout/sync scripts on all four dashboard pages. It does not replace any page's transaction, budget, investment, or tracker logic, and it does not change the D1 schema. This ZIP is prepared for manual upload; it has not been deployed to the live site.

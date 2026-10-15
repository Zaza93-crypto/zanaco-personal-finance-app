ZANACO / ALL MONEY — CLOUDFLARE DEPLOYMENT FIX

Likely issue:
The previously uploaded functions/_middleware.js had incorrectly escaped the HTML head-tag regular expression. This replacement corrects the expression and newline separators.

UPLOAD ONLY THIS FILE:
functions/_middleware.js

Steps:
1. Extract the ZIP.
2. In GitHub, open the functions folder, then _middleware.js.
3. Replace its full contents with the included file.
4. Commit the change to the branch connected to Cloudflare Pages.
5. Open Cloudflare Pages and check the newest deployment.

Keep unified-theme.css in the repository root and keep index.html, budget.html, investment.html, tracker.html, login.html, cloud-sync.js, logout.js, API functions, migrations, and wrangler.toml unchanged.

This package has not been deployed. If the next deployment still fails, open its Details and copy the first error line so the remaining cause can be identified.

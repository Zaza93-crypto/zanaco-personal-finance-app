ZANACO PERSONAL FINANCE APP — LIVE THEME FIX

This patch fixes the mismatch between the CSS theme files and the stylesheet injected by Cloudflare Pages middleware.

UPLOAD ONE FILE:
  functions/_middleware.js

HOW TO APPLY ON GITHUB MOBILE:
1. Open the repository:
   https://github.com/Zaza93-crypto/zanaco-personal-finance-app
2. Open the functions folder, then _middleware.js.
3. Edit the file and replace its entire contents with the _middleware.js included in this ZIP.
4. Commit the change to the main branch.
5. Wait for Cloudflare Pages to finish the Production deployment.
6. Open https://zanaco-personal-finance-app.pages.dev/?refresh=20261016
   and refresh the Budget and Investment pages too.

IMPORTANT:
- Do not delete the existing logout.js or cloud-sync.js files.
- This middleware continues loading those scripts and preserving the login redirect check.
- It uses the existing overview-theme.css, budget-theme.css and investment-theme.css files.
- No D1 database, migrations, login credentials, or stored finance records are changed.
- GitHub direct write access was denied in this session, so this patch must be uploaded manually.

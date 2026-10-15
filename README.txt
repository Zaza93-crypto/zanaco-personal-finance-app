ZANACO PERSONAL FINANCE APP — DARK FINTECH THEME PATCH
=====================================================

This ZIP contains CSS theme overrides for:
- Overview (index.html)
- Budget (budget.html)
- Investment (investment.html)

The patch is intentionally CSS-only. It does not modify JavaScript, login/logout,
Cloudflare Pages configuration, D1 database code, or cross-device synchronisation.

HOW TO APPLY
1. Unzip the archive.
2. Upload the three CSS files to the same root folder as index.html, budget.html,
   and investment.html in your GitHub repository.
3. In index.html, add this line immediately before </head>:
   <link rel="stylesheet" href="overview-theme.css">
4. In budget.html, add this line immediately before </head>:
   <link rel="stylesheet" href="budget-theme.css">
5. In investment.html, add this line immediately before </head>:
   <link rel="stylesheet" href="investment-theme.css">
6. Commit the changes and wait for Cloudflare Pages to deploy.
7. Reload the site. On mobile, if the old styles remain, clear the browser cache
   or open the page in a private tab.

IMPORTANT
- Keep the existing four pages, including tracker.html.
- Do not delete or replace existing scripts or data-sync code.
- This ZIP contains theme overrides, not full replacement HTML pages.
- CSS selectors vary across existing pages; review the result after deployment.
  The override uses common existing classes and generic card/control selectors.

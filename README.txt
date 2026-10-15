ALL MONEY — UNIFIED DARK THEME PATCH

Files included:
- tracker.html
- budget.html
- investment.html

What this patch does:
- Removes the explicit light-theme CSS override that made these three pages white while the homepage used the dark All Money design.
- Restores the pages' existing dark-blue theme variables and styling.
- Preserves the existing page HTML and JavaScript features; this is a visual-only patch.

Manual upload:
1. Download and unzip this package.
2. In the GitHub repository used by the Cloudflare Pages project, replace the existing tracker.html, budget.html, and investment.html with these three files.
3. Commit the three files to the deployment branch.
4. Wait for Cloudflare Pages to finish deploying.
5. Open each page and hard-refresh (Ctrl+Shift+R on desktop) or test in a private/incognito window.

Important:
- Do not replace index.html with this package; your homepage is already displaying the new design.
- This patch does not change database/sync configuration or claim that a deployment has completed.

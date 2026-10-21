ZANACO MARKET TRACKING PATCH — READ BEFORE DEPLOYING

What this patch adds
- Bitcoin price in USD and ZMW via CoinGecko public API, with provider timestamp and 15-minute stale warning.
- LuSE daily listed-security prices parsed from the official public market-data page. The parser fails closed (keeps previous data) if the page structure changes or too few rows are found.
- JSE explicitly marked unavailable until a verified, permitted data source is configured.
- D1 history tables and a GitHub Actions schedule.
- An HTML section snippet for the Investment Tracker page.

IMPORTANT: I could inspect your GitHub repository, but the connected GitHub integration denied write access (HTTP 403). No files were committed or deployed. This ZIP is a patch for you to upload.

INSTALL
1. Back up the current repository and Cloudflare D1 database first.
2. Copy the folders in this ZIP into the root of your existing repository. Do not replace the existing pages.
3. In Cloudflare Pages, verify the existing D1 binding is named DB.
4. Apply the SQL migration to the existing D1 database. Use Cloudflare's D1 console or `npx wrangler d1 migrations apply zanaco-finance --remote` from the project folder. Confirm the database name/binding before running.
5. Add a Cloudflare Pages environment secret named MARKET_REFRESH_SECRET. Use a long random secret; never put it in frontend code or Git.
6. In GitHub repository Settings → Secrets and variables → Actions, add:
   MARKET_API_URL = https://YOUR-CLOUDFLARE-PAGES-DOMAIN/api/market-prices
   MARKET_REFRESH_SECRET = same value as Cloudflare secret
7. Insert the contents of investment-market-section.html into investment.html inside the main content area (not inside another script or form).
8. Commit and wait for Cloudflare Pages deployment.
9. In GitHub Actions, run “Refresh market prices” manually once. Confirm the job succeeds, then open /api/market-prices and check the timestamps and source labels.
10. If the LuSE refresh fails, do not treat old prices as current; investigate the official page markup and retain stale warnings.

Schedule notes
- GitHub Actions scheduled workflows are best-effort and can run late. The 5-minute schedule is not a real-time guarantee.
- The free CoinGecko public API may impose rate limits or change terms. If the provider returns an error, last successful prices remain saved and become stale.
- LuSE's public website is the source; this is HTML parsing, not an official developer API. The parser intentionally stops on unexpected markup rather than guessing.
- The LuSE daily schedule is set to 16:25 UTC (18:25 Zambia time), Monday–Friday. Adjust if the exchange's publication time changes.
- This patch does not update investment holdings or transaction records.
- No price alerts are included.

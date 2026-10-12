ZANACO PERSONAL FINANCE — INSTALLABLE APP + CLOUD SYNC

WHAT IS INCLUDED
- index.html: repaired dashboard and transaction tracker.
- manifest + service worker + icons: installable PWA / basic offline shell.
- functions/api: Cloudflare Pages Functions for password-gated sync.
- schema.sql and migrations: D1 table schema.

IMPORTANT DATA LIMITATION
The embedded bank-statement extraction is incomplete and must remain marked unreconciled. This package does not invent the missing statement rows or claim bank verification. It retains the existing embedded statement rows and supports importing CSV files. PDF statement parsing is not yet enabled in this version.

DEPLOY TO CLOUDFLARE PAGES FOR PHONE/COMPUTER SYNC
1. Create a private GitHub repository for these files and upload the contents of this folder to its root.
2. In Cloudflare, create a Pages project connected to that repository. Framework preset: None. Build command: leave blank. Build output directory: /. If the UI rejects /, use .
3. Create a Cloudflare D1 database named zanaco-finance. Run schema.sql in the D1 console.
4. Add a D1 binding named DB to the Pages project, pointing to that database.
5. Add two encrypted Pages environment variables/secrets: APP_PASSWORD (a strong, unique sync password) and SESSION_SECRET (a separate long random secret). Do not put either secret in GitHub files.
6. Redeploy the Pages project. Use its HTTPS URL on both phone and computer. The Sync button will ask for APP_PASSWORD and use an HttpOnly secure session cookie.
7. Install: open the HTTPS site in Chrome on Android, browser menu > Install app / Add to Home screen. On desktop Chrome/Edge use the install icon or menu.

SECURITY NOTES
- This is password-gated personal sync, not a bank connection. It never logs into Zanaco or initiates transactions.
- Use a strong unique password, keep the GitHub repository private, enable device screen locks, and do not share the sync password.
- The API stores the app's transaction JSON in your D1 database. Cloudflare account access therefore matters.
- Test using a small dummy transaction first, then back up your current records before syncing actual financial data.
- Cross-device sync is only active after the Pages Functions and D1 steps above are completed. A GitHub Pages-only deployment cannot run these API functions.

IMPORT / BACKUP TESTING
- Import CSV supports ISO dates and common day/month/year dates, quoted commas, separate debit/credit columns, currency column, and duplicate skipping. Verify ambiguous date formats.
- Backup JSON includes all transactions, including the embedded statement rows, manual rows, imported rows, categories and reconciliation flags.
- Restore merges by transaction ID and otherwise uses a date/description/amount/type/currency fingerprint. Always check the result counts and statement totals.

VERIFIED TESTS (12 OCT 2026)
- Browser-driven smoke test passed against the bundled app with synthetic test data: initial rendering; CSV import with negative debit/transfer amounts; credit/debit/transfer type handling; monthly period filter; out-of-period row rejection; duplicate detection on a second import; JSON backup content; restore into a fresh app instance; import-history restore; reconciliation toggle; manual USD entry. No page JavaScript errors in the test run.
- Test data was synthetic and was not merged into the user's actual statement records.
- Not yet verified: live Cloudflare/D1 deployment and cross-device sync; Android installation on a physical phone; import of real Zanaco CSV variants; PDF parsing; complete reconciliation of the existing statement.
- Existing embedded statement extraction has 405 rows against 423 statement-reported entries (18-row gap). Keep this warning until reconciled; do not treat it as a complete audit.

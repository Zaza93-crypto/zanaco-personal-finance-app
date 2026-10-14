ALL MONEY — CLOUDFLARE-ONLY LOGIN AND SYNC

This replaces the Supabase login/sync approach with Cloudflare Pages Functions + D1.
It is intended for a single owner/personal dashboard protected by one dashboard password.
It does not provide separate user accounts.

FILES IN THIS PACK
- login.html: Cloudflare-password login page
- cloud-sync.js: cross-device sync using /api/sync
- functions/api/login.js: validates APP_PASSWORD and issues a signed HttpOnly session cookie
- functions/api/logout.js: clears the session cookie
- functions/api/sync.js: authenticated D1 state API
- migrations/0003_app_state.sql: D1 state table
- wrangler.toml: example D1 binding configuration (replace database_id)

BEFORE CHANGING THE LIVE SITE
1. Export a full dashboard backup on every browser/device that has records you need.
2. Do not assume separate local browser records will merge. The first device that creates the cloud record seeds it; once a cloud record exists, it becomes authoritative.
3. Download this pack and upload/replace the files in your GitHub repository root / functions / migrations as shown below.

GITHUB FILE PLACEMENT
- Replace login.html at repository root.
- Replace cloud-sync.js at repository root.
- Create functions/api/login.js
- Create functions/api/logout.js
- Create functions/api/sync.js
- Create migrations/0003_app_state.sql
- Keep the four existing dashboard pages and their existing features.

REMOVE SUPABASE REFERENCES
In index.html, tracker.html, budget.html, and investment.html, remove these script tags if present:
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.95.0"></script>
  <script src="supabase-config.js"></script>
Keep:
  <script src="cloud-sync.js"></script>
Do the same Supabase script removal in any other page that loads it. Delete supabase-config.js only after confirming no page still references it. Do not delete other unrelated project files.

CLOUDFLARE DASHBOARD SETUP
1. Open Workers & Pages and select the Pages project connected to this GitHub repository.
2. Settings > Functions > D1 database bindings: add binding name DB and select the intended database (e.g. zanaco-finance).
3. In D1 Console, run the contents of migrations/0003_app_state.sql. This creates a single state row table without deleting existing tables.
4. Pages project Settings > Variables and Secrets: add encrypted secrets:
   - APP_PASSWORD = a strong, unique dashboard password
   - SESSION_SECRET = a separate random secret with at least 32 random characters
5. Redeploy the Pages project from the latest main branch. Pages Functions must be deployed for /api/login and /api/sync to work. GitHub Pages alone cannot run these functions.
6. Open the Cloudflare Pages HTTPS URL and sign in using APP_PASSWORD.

TEST WITH DUMMY DATA FIRST
- Sign in on device A and create one dummy budget or investment.
- Sign in on device B using the same dashboard password; confirm the record appears.
- Edit the dummy record on device B; within roughly 5 seconds, check device A.
- Remove a dummy investment target and check that the deletion synchronizes.
- Wait for session expiry (8 hours) only if testing expiry; otherwise use /api/logout from browser devtools or clear site cookies to test sign-in redirect.
- Check Cloudflare Pages Functions logs and D1 records if any step fails.

IMPORTANT LIMITATIONS / SECURITY
- The included sync is a single-owner password gate, not multi-user accounts. Anyone with the password can access the same dashboard state.
- This is not bank authentication and does not connect to bank APIs.
- The session cookie is HttpOnly, Secure, SameSite=Strict and expires after 8 hours. Use HTTPS.
- The app state is stored as one JSON document. Avoid simultaneous edits on multiple devices at the exact same time; last write can win. Export backups regularly.
- Existing local data is not automatically merged with a cloud record. Back up first.
- Cloudflare deployment and cross-device sync have NOT been live-tested by this pack's creator. Test before using actual financial records.

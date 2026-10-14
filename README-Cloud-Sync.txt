ALL MONEY — LOGIN + CROSS-BROWSER CLOUD SYNC

WHAT THIS ADDS
- login.html: email/password sign-in and account creation using Supabase Auth
- One private cloud-state row per signed-in user; RLS restricts it to that user
- Shared data for transactions/imports, budgets, holdings, investment FX and investment target
- Realtime updates to other signed-in browsers
- Existing four HTML pages are retained and get a cloud-sync loader

IMPORTANT: This bundle is not live until connected to a Supabase project. I did not reuse your unrelated Supabase projects.

SETUP
1. Create/select a Supabase project for All Money. In Supabase, open SQL Editor, paste supabase-setup.sql and run it. If the final publication statement says the table is already added, skip that line and continue.
2. In Project Settings / API (or Connect), copy the Project URL and publishable key. Open supabase-config.js and replace YOUR_PROJECT_REF and YOUR_SUPABASE_PUBLISHABLE_KEY. Never use a service_role or secret key in browser code.
3. In Supabase Authentication settings, configure the site URL to your Cloudflare Pages URL and add that URL plus https://YOUR-SITE/login.html to allowed redirect URLs. For GitHub Pages, add that deployed URL too if you use it.
4. Upload/commit all files in this bundle to the same deployed repository root. Do not remove unrelated project files.
5. Open login.html on the deployed HTTPS site. Create an account and sign in. If email confirmation is enabled, confirm the email first.
6. Sign in with the same account on each browser/device. Data saved after cloud sync connects will be shared.

DATA SAFETY / FIRST SYNC
- Existing localStorage records on each browser may differ. This version uses the cloud record as the source of truth once one exists. Before the first shared sync, export backups from every browser that contains records you need. Then choose the one complete backup to preserve/import before using the account on other browsers. Do not rely on separate browser-local data automatically merging; conflicting records cannot be safely merged generically.
- When no cloud row exists, the first browser seeds it with its local records. Once the row exists, cloud data is loaded into the browser.
- Test with non-sensitive sample data first. This uses a Supabase publishable key in the frontend, protected by authentication and row-level security. Never publish a secret/service_role key.
- If configuration is absent, the dashboard remains local-only and displays a setup notice.
- Supabase Realtime needs the table in the supabase_realtime publication for instant updates; reload the page if a change does not appear.

LIMITATIONS
- Sync covers these known keys: allmoney_imports, allmoney_budgets, allmoney_investments_v1, allmoney_investment_fx, allmoney_investment_target_v1.
- Cloud sync is per login account; separate accounts cannot see each other's data.
- Cloud sync needs internet access. Keep exports as backups.

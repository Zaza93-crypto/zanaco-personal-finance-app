# All Money — Profile and Settings patch

## Included
- `account-tools.js`: profile, settings and security dialogs injected on all four dashboard pages.
- `functions/api/account.js`: reads and updates the signed-in user's display name and email.
- `functions/api/change-password.js`: verifies the current password and securely updates the password hash and salt.
- HTML patches to load the account tools on Overview, Tracker, Budget and Investment pages.
- Optional sync patches for storing settings preferences in the existing per-user D1 sync state.

## Apply carefully
1. Back up/download the current GitHub repository first.
2. Add `account-tools.js` to the repository root.
3. Add `functions/api/account.js` and `functions/api/change-password.js`.
4. Apply the four HTML script-tag changes so `account-tools.js` loads on all dashboard pages.
5. Add `allmoney_preferences_v1` to both the `KEYS` list in `cloud-sync.js` and the `ALLOWED` set in `functions/api/sync.js` if you want settings to sync. Without these optional edits, preferences remain local to each browser.
6. Commit and wait for Cloudflare Pages deployment.
7. Test profile name/email save, password update using the correct current password, and settings persistence after refresh.

## Important
- Profile and password endpoints require the existing Cloudflare Pages D1 binding `DB`, user table and session authentication already used by login.
- Settings provide a default currency for new transaction/investment entries, compact table rows and reduced motion. The currency preference does not convert historical amounts. Currency conversion must use an explicit exchange rate and should be added separately.
- Apply `script.js.patch` to remove the old alert-only click handler; otherwise it will compete with the new profile/settings dialog.
- Email updates can affect future sign-in, so verify the new email address carefully before saving.
- GitHub write access was denied during this session; these files are prepared for you to add, not deployed to the live website.

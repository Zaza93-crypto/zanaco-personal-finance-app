ZANACO PERSONAL FINANCE APP - SINGLE LINK + DEVICE SYNC
=========================================================
UPLOAD ONLY THIS FILE:
  functions/_middleware.js

HOW TO UPLOAD
1. Open your existing GitHub repository.
2. Navigate to the "functions" folder.
3. Upload _middleware.js there (overwrite an existing file ONLY after
   backing it up and reviewing it; it may contain other app logic).
4. Commit the change and wait for Cloudflare Pages to deploy.
5. Open your usual website address (no separate login link needed).

WHAT IT DOES
- Visiting the main site while logged out sends you to login.html.
- Logged-in users stay on the existing dashboard.
- Adds your EXISTING cloud-sync.js to all four dashboard pages
  without replacing any of their design or content.
- Leaves your existing Cloudflare Pages + D1 APIs untouched.

REQUIREMENTS
- Your repository must already have cloud-sync.js in the root.
- /api/sync and /api/login must be working.
- Existing Cloudflare Pages Functions routes must be enabled.
- D1 must already have the user_app_state table.
- If functions/_middleware.js ALREADY EXISTS, do not overwrite it
  without merging its existing logic first.
- Your cloud-sync.js uses last-write-wins: avoid simultaneous edits
  on different devices.

TEST
1. Log out and visit the main website address. It should show login.
2. Sign in and save a small budget change on Device A.
3. Sign in with the SAME account on Device B and refresh.
4. Wait a few seconds for sync; confirm the change appears.

IMPORTANT: This ZIP is prepared for manual upload. It has NOT been
uploaded or deployed to your GitHub/Cloudflare account.

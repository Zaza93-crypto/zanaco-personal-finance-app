ALL MONEY — SESSION SECRET MINIMUM FIX

This ZIP contains two replacement files only:
- functions/_lib/auth.js
- functions/api/register.js

HOW TO UPLOAD
1. Open your GitHub repository: Zaza93-crypto/zanaco-personal-finance-app
2. Replace the existing file functions/_lib/auth.js with the one in this ZIP.
3. Replace the existing file functions/api/register.js with the one in this ZIP.
4. Commit the changes to the main branch and wait for Cloudflare Pages to deploy.
5. In Cloudflare Pages > your project > Settings > Variables and Secrets, set SESSION_SECRET.
   The code now accepts 10 characters minimum, but for security use a randomly generated
   secret of at least 32 characters. Do not use your email, name, or normal password.
6. Reload /login.html and try account creation again.

IMPORTANT
- Upload/replace these files at their exact paths; do not upload the ZIP as a single file into the repository.
- Do not delete other dashboard files.
- This only changes the minimum length validation. It does not create the SESSION_SECRET setting
  for you and does not apply the D1 migration. The DB binding and account migration must already
  be configured for registration and cloud sync to work.

ALL MONEY — FULL WEBSITE REDESIGN (shared theme)

This package applies one consistent visual design across:
- index.html (overview)
- tracker.html
- budget.html
- investment.html

Design direction:
- Lavender / warm-white canvas with subtle coral and purple glow
- Purple-to-coral brand treatment and a polished overview hero
- Rounded white cards, soft shadows, consistent buttons and forms
- More legible metrics and tables
- Responsive navigation and mobile-friendly table scrolling
- Green positive values and red negative values, not color alone for controls

IMPORTANT
This is a presentation-only patch. It does not rewrite financial calculations, statement imports,
PDF/Excel parsing, login, Cloudflare Functions, D1, or cross-device sync.

INSTALL ON WINDOWS
1. Download the latest repository ZIP from:
   https://github.com/Zaza93-crypto/zanaco-personal-finance-app
2. Extract the repository ZIP.
3. Copy all-money-theme.css and apply-theme.ps1 from this package into the repository root
   (the same folder as index.html, tracker.html, budget.html and investment.html).
4. Open PowerShell in that folder and run:
   powershell -ExecutionPolicy Bypass -File .\apply-theme.ps1
5. Inspect the four updated HTML files and the *.before-full-redesign.bak backups.
6. Commit and push the changed files to the main branch. Wait for Cloudflare Pages to deploy.
7. Hard-refresh the site (Ctrl+F5) or open it in a private window.

If PowerShell blocks scripts, use:
   Set-ExecutionPolicy -Scope Process Bypass
   .\apply-theme.ps1

This ZIP does NOT contain full replacement copies of the site's HTML/JavaScript. It adds one shared
stylesheet and links it to the existing pages to avoid overwriting working business logic.
No changes have been deployed by this package alone.

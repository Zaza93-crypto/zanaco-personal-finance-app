ALL MONEY WEBSITE REDESIGN — FULL SITE THEME

This package changes the visual presentation of the website pages to match the supplied mobile finance reference:
- coral / pink / purple gradient accents
- warm white background and rounded cards
- consistent buttons, forms, tables and navigation
- responsive layouts for phone and desktop
- existing logout and cloud-sync scripts injected by middleware

FILES
- unified-theme.css (upload to repository root)
- functions/_middleware.js (replace the existing file)
- README.txt

UPLOAD
1. Extract this ZIP.
2. Upload unified-theme.css to the repository root.
3. Replace functions/_middleware.js with the included file.
4. Keep index.html, budget.html, investment.html, tracker.html, login.html, API functions, migrations, cloud-sync.js, logout.js and wrangler.toml unchanged.
5. Commit the changes to the branch connected to Cloudflare Pages and wait for deployment.

The middleware injects the stylesheet and existing scripts into the four dashboard pages. It corrects the head-tag regex and uses valid newline separators. This is a manual-upload package; it has not been deployed or verified live.

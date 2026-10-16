ZANACO PERSONAL FINANCE — VISUAL REDESIGN PACKAGE

Design direction follows the supplied mockup: soft lavender canvas, crisp white cards,
navy financial text, purple gradient primary buttons, colour-coded finance indicators,
clean tables, consistent navigation and responsive mobile scrolling.

Included:
- zanaco-redesign.css — shared styling for index, tracker, budget and investment pages
- apply-redesign.ps1 — adds the stylesheet link to each existing page and creates backups
- README.txt — installation steps

INSTALL:
1. Download the latest repository ZIP from
   https://github.com/Zaza93-crypto/zanaco-personal-finance-app
2. Extract the repository into a folder.
3. Copy zanaco-redesign.css and apply-redesign.ps1 into the same folder as the four HTML pages.
4. Open PowerShell in that folder and run:
   powershell -ExecutionPolicy Bypass -File .\apply-redesign.ps1
5. Review all four HTML files and the generated .before-visual-redesign.bak backups.
6. Commit and push changes to the main branch. Wait for Cloudflare Pages to deploy.
7. Hard refresh the live website (Ctrl+F5).

Wrangler note: current wrangler.toml uses pages_build_output_dir = ".". Keep the stylesheet
in the repository root alongside the HTML pages; no wrangler.toml change is needed.

IMPORTANT LIMITATION:
This package changes presentation only. It does not replace the four HTML pages, add new chart
functionality, or rewrite application logic. Existing logic is preserved because the existing
HTML and scripts are left in place. GitHub direct writes were rejected by the connected integration,
so this package has not been deployed to the live site.

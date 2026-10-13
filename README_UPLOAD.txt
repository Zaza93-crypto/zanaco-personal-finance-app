ALL MONEY DASHBOARD — MULTI-PAGE GITHUB PAGES PACKAGE

Upload ALL THREE HTML files to the ROOT of your existing GitHub Pages repository, replacing index.html and adding tracker.html and budget.html:
- index.html — Overview
- tracker.html — Financial Tracker and statement imports
- budget.html — Custom Budget Planner

Keep the files together in the same repository folder. All pages use the same browser localStorage on the same site origin, so imported transactions and budgets can be shared between these pages in the same browser. This does not provide cross-device/cloud sync.

Before replacing files, download a backup of your current repository. CSV is the most reliable statement import format. Excel depends on the external XLSX library loading. PDF/scanned OCR is not implemented.

After committing, visit your GitHub Pages URL and use the Overview / Financial Tracker / Budget Planner navigation. Test with a small sample CSV and confirm totals before relying on it. Existing statement data includes a known 18-row extraction gap.

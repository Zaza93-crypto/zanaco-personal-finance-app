# Zanaco Personal Finance App — Test Report

Date: 12 October 2026

## Passed in a browser automation smoke test
- App initialises with the existing 405 embedded statement rows and no JavaScript page errors.
- Monthly upload selection and CSV import.
- Negative debit amounts become positive transaction magnitudes while retaining debit type.
- Negative transfer amounts remain transfers and do not become expenses.
- Credit, debit, and transfer types are retained separately.
- Out-of-period row is rejected and counted in the import summary.
- Re-importing the same CSV skips the 3 likely duplicate rows.
- New imports remain unreconciled by default.
- Full JSON backup includes transaction list and upload history.
- Backup restores into a fresh app instance without duplicating the embedded rows.
- Import history is restored from the backup.
- Reconciliation can be toggled by the user for an individual transaction.
- Manual transaction form can record a USD transaction.

## Not yet tested / not yet complete
- Live Cloudflare Pages Functions and D1 deployment, including synchronisation between separate devices.
- Physical Android install and offline behaviour.
- Compatibility with every possible Zanaco CSV export format.
- PDF statement parsing.
- Reconciliation of the underlying statement extraction.

## Important financial data warning
The embedded source currently has 405 extracted rows while the statement summary reports 423 transactions, a gap of 18. This discrepancy remains visible; no missing transactions were invented. Synthetic test rows were used only in the test browser context and were not written into the downloadable app's embedded data.

## Additional statement formats (2026-10-12)
- Expanded the upload input to accept CSV/TXT, Excel XLSX/XLS, and PDF files.
- Added browser-side Excel parsing using SheetJS and text extraction using PDF.js.
- Added a 15 MB upload limit and explicit rejection messages when a PDF layout/header cannot be identified.
- Excel import reads the first worksheet and searches for a header row containing date, description/details, and amount/debit/credit columns.
- PDF support is heuristic for selectable-text PDFs only. Scanned/image-only PDFs require OCR and are not supported by this parser. Export CSV/Excel from Zanaco when a PDF is rejected.
- Syntax validation of embedded JavaScript passed with Node.js. This is not a substitute for end-to-end browser testing against representative Zanaco XLSX/PDF statements; imported transactions remain unreconciled until verified.


## Monthly budget page addition (12 Oct 2026)
- Added a Monthly budget section and a header shortcut.
- Added month selector and separate ZMW/USD budget ledgers.
- Added per-category monthly limits, custom categories, spent-to-date, progress bars, and remaining/over-budget figures.
- Budget spending counts recorded debit transactions only; credits and transfers are excluded.
- Budget data and custom categories are included in JSON backup/restore.
- Extended Cloudflare sync endpoint to read/write budget rows in a new D1 `budgets` table; apply migration `0002_budgets.sql` before cloud sync.
- All inline JavaScript passes `node --check`. Browser-based interactive testing of the new budget controls was attempted but blocked by the execution environment, so save/reload and cross-device sync still require verification after deployment.

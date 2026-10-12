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

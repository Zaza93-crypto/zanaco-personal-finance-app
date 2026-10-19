# All Money — redesigned financial dashboard

## Included
- `index.html`: overview with balance/income/expense/investment totals, income-vs-expense bars, category breakdown, quick actions and money-watch alerts.
- `tracker.html`: transaction entry/edit/delete, date/category/type/currency/reconciliation filters, statement import preview, duplicate warnings and reconciliation checkboxes.
- `budget.html`: monthly category budgets, spending progress, 75%+ budget alerts, edit/delete and month navigation.
- `investment.html`: holdings, asset allocation, portfolio value, invested amount, gain/loss, add/edit/delete.
- `style.css`: shared responsive design matching the supplied reference.
- `script.js`: client-side dashboard logic and local persistence.

## Important deployment notes
1. Make a backup of your current repository before replacing files.
2. Upload the four HTML pages, `style.css`, and `script.js` together to the existing Cloudflare Pages project.
3. USD entries can be recorded, but ZMW summary totals intentionally exclude USD records because no live or user-configured FX conversion rate is included. Set a verified conversion rate and add conversion logic before relying on combined multi-currency totals. The dashboard saves to this browser/device using localStorage. This package does **not** implement or alter your Cloudflare D1/API authentication and cross-device sync. Those require the existing server endpoints to be connected and tested; do not treat local browser storage as cloud sync.
4. PDF/Excel readers load from public CDNs, so statement import requires an internet connection. PDF parsing only works for text-based PDFs; scanned image PDFs need OCR. Bank statement formats vary, so verify the preview and totals before importing.
5. The dashboard starts with sample October 2026 records only when no saved dashboard data exists. Replace sample entries with your own records before relying on totals.

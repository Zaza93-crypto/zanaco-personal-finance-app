ALL MONEY DASHBOARD — REPLACEMENT FILES

Contents
- index.html: Overview
- tracker.html: Financial tracker and statement imports
- budget.html: Budget planner
- investment.html: Investment holdings and targets

Deploy
1. Download and extract this ZIP.
2. In the existing GitHub repository, replace these four HTML files with the files in this package. Keep unrelated supporting files and folders.
3. Commit/push to the existing production branch and let Cloudflare Pages deploy.
4. Open the deployed site and check all four navigation links.

Data safety
- The dashboard stores records in browser localStorage; this does not synchronize different devices or browsers.
- Use Backup data / Export backup before replacing files, clearing browser data, or changing phones. The full backup includes imported transactions, budget categories, investment holdings, exchange-rate setting, and investment target when available.
- Restore data replaces the corresponding saved data categories contained in the selected backup.
- Imported statements and prices are not verified by a bank or brokerage connection. Investment prices and FX rate are manually entered.
- Existing extracted statement data has a known 18-row gap; do not treat it as a complete audit.

The ZIP contains only the four requested replacement HTML files plus this README; it does not include or delete other repository assets.

ALL MONEY — STATEMENT IMPORT FIX

Replace only tracker.html in the root of the GitHub repository used by Cloudflare Pages.

This update:
- Adds PDF to the upload picker.
- Loads the Excel reader only when an XLS/XLSX file is imported, with a fallback CDN.
- Adds PDF.js text extraction for text-based PDF statements.
- Gives clearer error messages for unsupported layouts and scanned/image-only PDFs.
- Preserves the existing transaction review, duplicate checks, category assignment, and local save behavior.

Important limitations:
- Scanned/image-only PDFs need OCR first.
- PDF statement layouts vary; a text-based PDF can open but still need a format-specific parser if its columns cannot be recognized.
- These external reader libraries need an internet connection to load.
- After replacing tracker.html, commit it and wait for Cloudflare Pages deployment. Test with a copy of a statement and review imported totals before relying on them.

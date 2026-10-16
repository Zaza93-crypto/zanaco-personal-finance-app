#!/usr/bin/env python3
"""Patch current repository pages in place, with backups. Does not touch JS business logic."""
from pathlib import Path
import re,sys
root=Path(__file__).resolve().parent
pages=["index.html","tracker.html","budget.html","investment.html"]
for page in pages:
    if not (root/page).is_file():
        sys.exit(f"Missing {page}. Put all package files beside your existing four HTML pages.")
if not (root/"all-money-redesign.css").is_file() or not (root/"all-money-redesign.js").is_file():
    sys.exit("Missing design assets.")
for page in pages:
    p=root/page
    text=p.read_text(encoding="utf-8-sig")
    backup=p.with_name(page+".before-redesign.bak")
    if not backup.exists():backup.write_text(text,encoding="utf-8")
    text=re.sub(r'\s*<link[^>]+all-money-redesign\.css[^>]*>',"",text,flags=re.I)
    text=re.sub(r'\s*<script[^>]+all-money-redesign\.js[^>]*>\s*</script>',"",text,flags=re.I)
    if not re.search(r'</head\s*>',text,re.I):sys.exit(f"{page} has no </head>.")
    links='\n<link rel="stylesheet" href="all-money-redesign.css?v=20261016">\n<script defer src="all-money-redesign.js?v=20261016"></script>\n'
    text=re.sub(r'</head\s*>',links+'</head>',text,count=1,flags=re.I)
    p.write_text(text,encoding="utf-8")
    print("Updated",page)
print("Done. Upload four modified HTML files AND both all-money-redesign assets.")

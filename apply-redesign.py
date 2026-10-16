from pathlib import Path
import re

FILES = ["index.html", "tracker.html", "budget.html", "investment.html"]
STYLE = '<link rel="stylesheet" href="/all-money-redesign.css?v=20261016">'
SCRIPT = '<script src="/all-money-redesign.js?v=20261016"></script>'

root = Path(__file__).resolve().parent
changed = []
for name in FILES:
    path = root / name
    if not path.exists():
        print(f"SKIP: {name} not found in this folder")
        continue
    html = path.read_text(encoding="utf-8")
    if "all-money-redesign.css" not in html:
        if re.search(r"</head>", html, flags=re.I):
            html = re.sub(r"</head>", STYLE + "\n</head>", html, count=1, flags=re.I)
        else:
            print(f"SKIP: {name} has no closing </head>")
            continue
    if "all-money-redesign.js" not in html:
        if re.search(r"</body>", html, flags=re.I):
            html = re.sub(r"</body>", SCRIPT + "\n</body>", html, count=1, flags=re.I)
        else:
            print(f"SKIP: {name} has no closing </body>")
            continue
    path.write_text(html, encoding="utf-8")
    changed.append(name)
print("\nUpdated:", ", ".join(changed) if changed else "no files")
print("The redesign CSS/JS files must remain in the repository root.")

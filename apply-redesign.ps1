$ErrorActionPreference = "Stop"
$pages = @("index.html", "tracker.html", "budget.html", "investment.html")
$css = Join-Path (Get-Location) "zanaco-redesign.css"
if (!(Test-Path $css)) { throw "Copy zanaco-redesign.css into your repository root first." }
foreach ($page in $pages) {
  if (!(Test-Path $page)) { throw "Missing $page. Run from the root of zanaco-personal-finance-app." }
  $content = Get-Content -Raw -Encoding UTF8 $page
  $link = '<link rel="stylesheet" href="zanaco-redesign.css?v=20261016">'
  if ($content -match 'zanaco-redesign\.css') {
    $content = [regex]::Replace($content, '<link[^>]+zanaco-redesign\.css[^>]*>', $link, 1)
  } elseif ($content -match '(?i)</head>') {
    $content = [regex]::Replace($content, '(?i)</head>', "  $link`r`n</head>", 1)
  } else { throw "$page has no closing </head>; stopped." }
  $backup = "$page.before-visual-redesign.bak"
  if (!(Test-Path $backup)) { Copy-Item $page $backup }
  Set-Content -Path $page -Value $content -Encoding UTF8
  Write-Host "Linked redesign stylesheet in $page"
}
Write-Host "Review changes, commit and push to GitHub, then wait for Cloudflare Pages deployment."

$ErrorActionPreference = "Stop"
$pages = @("index.html", "tracker.html", "budget.html", "investment.html")
$cssFile = Join-Path (Get-Location) "all-money-theme.css"

if (-not (Test-Path $cssFile)) {
  throw "all-money-theme.css was not found. Extract this ZIP into the root of your repository."
}

foreach ($page in $pages) {
  if (-not (Test-Path $page)) {
    throw "Missing $page. Run this script from the repository root where all four HTML files exist."
  }

  $content = Get-Content -Raw -Encoding UTF8 $page
  $link = '<link rel="stylesheet" href="all-money-theme.css?v=20261016b">'
  if ($content -match 'all-money-theme\.css') {
    $content = [regex]::Replace($content, '<link[^>]+all-money-theme\.css[^>]*>', $link, 1)
  } elseif ($content -match '(?i)</head>') {
    $content = [regex]::Replace($content, '(?i)</head>', "  $link`r`n</head>", 1)
  } else {
    throw "$page does not contain a closing </head> tag. No automatic change was made to that file."
  }

  $backup = "$page.before-full-redesign.bak"
  if (-not (Test-Path $backup)) { Copy-Item $page $backup }
  Set-Content -Path $page -Value $content -Encoding UTF8
  Write-Host "Updated $page"
}
Write-Host ""
Write-Host "Theme linked on all four pages. Review the files, then commit and push to GitHub."

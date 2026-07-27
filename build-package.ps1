param(
  [string]$OutputName = "pluffies-game-my-gaming.zip"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$distRoot = Join-Path $projectRoot ".dist"
$stagingRoot = Join-Path $distRoot "staging"
$zipPath = Join-Path $distRoot $OutputName

$requiredPaths = @(
  "manifesto.json",
  "index.html",
  "icone.svg",
  "capa.svg",
  "scripts",
  "estilos"
)

$packagePaths = @(
  "manifesto.json",
  "index.html",
  "icone.svg",
  "capa.svg",
  "favicon.svg",
  "style.css",
  "game.js",
  "README.md",
  "js",
  "scripts",
  "estilos"
)

foreach ($relativePath in $requiredPaths) {
  $fullPath = Join-Path $projectRoot $relativePath
  if (-not (Test-Path $fullPath)) {
    throw "Arquivo ou pasta obrigatória ausente: $relativePath"
  }
}

if (-not (Test-Path $distRoot)) {
  New-Item -ItemType Directory -Path $distRoot -Force | Out-Null
}

if (Test-Path $stagingRoot) {
  Remove-Item -LiteralPath $stagingRoot -Recurse -Force
}

if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null

foreach ($relativePath in $packagePaths) {
  $sourcePath = Join-Path $projectRoot $relativePath
  if (-not (Test-Path $sourcePath)) {
    continue
  }

  $destinationPath = Join-Path $stagingRoot $relativePath
  $destinationParent = Split-Path -Parent $destinationPath
  if (-not (Test-Path $destinationParent)) {
    New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
  }

  if ((Get-Item $sourcePath) -is [System.IO.DirectoryInfo]) {
    Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Recurse -Force
  }
  else {
    Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Force
  }
}

Compress-Archive -Path (Join-Path $stagingRoot "*") -DestinationPath $zipPath -CompressionLevel Optimal

Write-Host ""
Write-Host "Pacote gerado com sucesso:" -ForegroundColor Green
Write-Host $zipPath
Write-Host ""
Write-Host "Conteúdo validado para upload no My Gaming:"
Write-Host "- manifesto.json na raiz"
Write-Host "- index.html na raiz"
Write-Host "- ícone e capa presentes"
Write-Host "- pastas scripts/ e estilos/ incluídas"

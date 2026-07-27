param(
  [string]$DestinationDir = ""
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = Join-Path $projectRoot "manifesto.json"
$buildScriptPath = Join-Path $projectRoot "build-package.ps1"
$distRoot = Join-Path $projectRoot ".dist"

if (-not (Test-Path $manifestPath)) {
  throw "manifesto.json nao encontrado."
}

if (-not (Test-Path $buildScriptPath)) {
  throw "build-package.ps1 nao encontrado."
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

$identifier = [string]$manifest.identificador
$version = [string]$manifest.versao

if ([string]::IsNullOrWhiteSpace($identifier)) {
  throw "manifesto.json invalido: identificador e obrigatorio."
}

if ([string]::IsNullOrWhiteSpace($version)) {
  throw "manifesto.json invalido: versao e obrigatoria."
}

$outputName = "{0}-v{1}-my-gaming.zip" -f $identifier, $version

& powershell -ExecutionPolicy Bypass -File $buildScriptPath -OutputName $outputName

$zipPath = Join-Path $distRoot $outputName
if (-not (Test-Path $zipPath)) {
  throw "Falha ao gerar o pacote final."
}

$hash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash
$packageInfo = [pscustomobject]@{
  identifier = $identifier
  version = $version
  outputName = $outputName
  zipPath = $zipPath
  sha256 = $hash
  generatedAtUtc = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
}

$packageInfoPath = Join-Path $distRoot "latest-package.json"
$packageInfo | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $packageInfoPath -Encoding UTF8

if (-not [string]::IsNullOrWhiteSpace($DestinationDir)) {
  if (-not (Test-Path $DestinationDir)) {
    New-Item -ItemType Directory -Path $DestinationDir -Force | Out-Null
  }

  Copy-Item -LiteralPath $zipPath -Destination (Join-Path $DestinationDir $outputName) -Force
  Copy-Item -LiteralPath $packageInfoPath -Destination (Join-Path $DestinationDir "latest-package.json") -Force
}

Write-Host ""
Write-Host "Pacote de publicacao pronto:" -ForegroundColor Green
Write-Host $zipPath
Write-Host ""
Write-Host "SHA256:"
Write-Host $hash
Write-Host ""
Write-Host "Resumo salvo em:"
Write-Host $packageInfoPath
Write-Host ""
Write-Host "Proximo passo:"
Write-Host "- subir o ZIP manualmente no painel da My Gaming"

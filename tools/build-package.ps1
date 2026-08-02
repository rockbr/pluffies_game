param(
  [string]$OutputName = "pluffies-game-my-gaming.zip"
)

$ErrorActionPreference = "Stop"

$toolsRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $toolsRoot
$distRoot = Join-Path $projectRoot ".dist"
$stagingRoot = Join-Path $distRoot "staging"
$zipPath = Join-Path $distRoot $OutputName
$manifestPath = Join-Path $projectRoot "manifesto.json"

if (-not (Test-Path $manifestPath)) {
  throw "manifesto.json nao encontrado na raiz do projeto."
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

$requiredPaths = @(
  "manifesto.json",
  "src\scripts",
  "src\styles",
  "src\js"
)

$manifestReferencedFiles = @(
  $manifest.arquivo_inicial,
  $manifest.icone,
  $manifest.capa
) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique

$packagePaths = @(
  "manifesto.json",
  "assets",
  "src"
) + $manifestReferencedFiles | Select-Object -Unique

foreach ($relativePath in $requiredPaths) {
  $fullPath = Join-Path $projectRoot $relativePath
  if (-not (Test-Path $fullPath)) {
    throw "Arquivo ou pasta obrigatoria ausente: $relativePath"
  }
}

if ([string]::IsNullOrWhiteSpace($manifest.formato) -or $manifest.formato -ne "my-gaming") {
  throw "manifesto.json invalido: formato deve ser my-gaming."
}

if ([string]::IsNullOrWhiteSpace($manifest.versao_formato)) {
  throw "manifesto.json invalido: versao_formato e obrigatorio."
}

if ([string]::IsNullOrWhiteSpace($manifest.sdk.versao)) {
  throw "manifesto.json invalido: sdk.versao e obrigatorio."
}

if ([string]::IsNullOrWhiteSpace($manifest.ranking.tipo)) {
  throw "manifesto.json invalido: ranking.tipo e obrigatorio."
}

if ([string]::IsNullOrWhiteSpace($manifest.integracao.plataforma) -or $manifest.integracao.plataforma -ne "my-gaming") {
  throw "manifesto.json invalido: integracao.plataforma deve ser my-gaming."
}

if ([string]::IsNullOrWhiteSpace($manifest.integracao.modo) -or $manifest.integracao.modo -ne "iframe") {
  throw "manifesto.json invalido: integracao.modo deve ser iframe."
}

if (-not $manifest.integracao.handshake.obrigatorio) {
  throw "manifesto.json invalido: handshake obrigatorio deve ser true."
}

if ($manifest.integracao.handshake.solicitacao -ne "handshakeJogo" -or
    $manifest.integracao.handshake.sucesso -ne "handshakePlataformaOk" -or
    $manifest.integracao.handshake.erro -ne "handshakePlataformaErro") {
  throw "manifesto.json invalido: nomes do handshake estao fora do padrao My Gaming."
}

if ($manifest.integracao.sessao.embedded_param -ne "embedded" -or
    $manifest.integracao.sessao.player_param -ne "player" -or
    $manifest.integracao.sessao.token_param -ne "sessionToken" -or
    $manifest.integracao.sessao.parent_origin_param -ne "parentOrigin" -or
    -not $manifest.integracao.sessao.token_obrigatorio_para_resultado_oficial) {
  throw "manifesto.json invalido: parametros de sessao estao fora do padrao My Gaming."
}

if (-not $manifest.integracao.origem.usar_parent_origin_exato -or
    -not $manifest.integracao.origem.bloquear_post_message_com_asterisco) {
  throw "manifesto.json invalido: configuracao de origem esta fora do padrao My Gaming."
}

foreach ($relativePath in $manifestReferencedFiles) {
  $fullPath = Join-Path $projectRoot $relativePath
  if (-not (Test-Path $fullPath)) {
    throw "Arquivo referenciado no manifesto nao encontrado: $relativePath"
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
Write-Host "Conteudo validado para upload no My Gaming:"
Write-Host "- manifesto.json na raiz"
Write-Host "- arquivo inicial, icone e capa conforme manifesto"
Write-Host "- pastas src/ e assets/ incluidas"
Write-Host "- contrato de integracao conferido"
Write-Host "- sem README.md ou arquivos fora do padrao"

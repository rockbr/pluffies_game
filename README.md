# Pluffies

Jogo HTML5 preparado para envio em ZIP para a plataforma My Gaming.

## Descricao do jogo

Pluffies e um jogo de garra em estilo arcade. O jogador move a garra para capturar ursos de pelucia, marcar pontos e avancar antes que o tempo acabe. As fases aumentam a dificuldade com mais velocidade, precisao e personagens especiais, como urso anjo, caveira, fantasma e BIG Urso. Os controles usam `A` e `D` ou as setas para mover, e `Espaco` ou seta para baixo para soltar a garra.

## Estrutura principal

- `manifesto.json`: contrato de integracao e metadados do jogo
- `index.html`: entrada principal
- `assets/`: icones, favicon e capa
- `assets/badges/`: artes de badges enviadas para a My Gaming
- `src/scripts/`: bootstrap e integracao com a My Gaming
- `src/js/`: logica principal
- `src/styles/`: folha de estilo do jogo
- `tools/build-package.ps1`: monta o ZIP no formato aceito
- `tools/publish-my-gaming.ps1`: gera o artefato final versionado para upload manual

## Regras de integracao

O pacote segue o contrato da My Gaming:

- `formato = my-gaming`
- `integracao.modo = iframe`
- handshake obrigatorio com a plataforma
- uso de `sessionToken` e `parentOrigin`
- envio de resultado oficial apenas com sessao validada
- bloqueio de `postMessage(..., "*")`

## Como testar localmente

1. Abra `index.html` no navegador.
2. Para testar embarcado, rode o jogo pela My Gaming ou abra a URL com os parametros:
   - `embedded=1`
   - `player`
   - `sessionToken`
   - `parentOrigin`

## Como gerar o ZIP

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\build-package.ps1
```

O arquivo sera gerado em `.dist\pluffies-game-my-gaming.zip`.

## Como publicar para upload manual

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\publish-my-gaming.ps1
```

O script gera:

- um ZIP versionado, por exemplo `pluffies-game-v1.0.0-my-gaming.zip`
- `latest-package.json` com caminho, versao e hash SHA-256

Tambem e possivel copiar o artefato para outra pasta:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\publish-my-gaming.ps1 -DestinationDir "D:\Pacotes\MyGaming"
```

## Observacoes

- o ranking oficial fica na My Gaming, nao no jogo
- o ranking local so vale para uso fora da plataforma
- em modo embarcado, o nome do jogador vem da sessao da plataforma e nao deve ser alterado manualmente
- a badge de primeira partida e declarada em `manifesto.json` no bloco `badge_primeira_partida`
- a badge beta opcional pode ser declarada em `manifesto.json` no bloco `badge_beta_tester`

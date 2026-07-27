# Pluffies

Jogo HTML5 preparado para envio em ZIP para a plataforma My Gaming.

## Estrutura principal

- `manifesto.json`: contrato de integracao e metadados do jogo
- `index.html`: entrada principal
- `scripts/sdk-jogos.js`: bridge com a My Gaming
- `scripts/jogo.js`: bootstrap do runtime
- `js/`: logica principal
- `estilos/`: folha de estilo do jogo
- `build-package.ps1`: monta o ZIP no formato aceito
- `publish-my-gaming.ps1`: gera o artefato final versionado para upload manual

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
powershell -ExecutionPolicy Bypass -File .\build-package.ps1
```

O arquivo sera gerado em `.dist\pluffies-game-my-gaming.zip`.

## Como publicar para upload manual

```powershell
powershell -ExecutionPolicy Bypass -File .\publish-my-gaming.ps1
```

O script gera:

- um ZIP versionado, por exemplo `pluffies-game-v1.0.0-my-gaming.zip`
- `latest-package.json` com caminho, versao e hash SHA-256

Tambem e possivel copiar o artefato para outra pasta:

```powershell
powershell -ExecutionPolicy Bypass -File .\publish-my-gaming.ps1 -DestinationDir "D:\Pacotes\MyGaming"
```

## Observacoes

- o ranking oficial fica na My Gaming, nao no jogo
- o ranking local so vale para uso fora da plataforma
- em modo embarcado, o nome do jogador vem da sessao da plataforma e nao deve ser alterado manualmente

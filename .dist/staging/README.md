# Pluffies

Jogo mobile inspirado em maquina de pegar bichinho de pelucia.

## Conceito

O jogador controla uma garra em diferentes maquinas e precisa capturar pelucias para avancar de fase.

Cada fase aumenta a dificuldade com base em:

- tamanho da pelucia
- peso da pelucia
- formato da pelucia
- precisao da garra
- forca da garra
- tempo disponivel

## Loop principal

1. Escolher a fase.
2. Posicionar a garra.
3. Descer a garra no momento certo.
4. Tentar prender a pelucia.
5. Levar a pelucia ate a saida.
6. Ganhar moedas, pontos ou destravar a proxima fase.

## Progressao de fases

### Fase 1

- pelucias grandes
- garra forte
- pouco movimento dentro da maquina
- tempo folgado

### Fase 2

- pelucias medias
- garra com menos firmeza
- espacos menores entre os brinquedos

### Fase 3

- pelucias pequenas
- pelucias escorregadias
- garra mais sensivel ao erro de posicionamento

### Fase 4+

- formatos irregulares
- limite de tentativas
- fisica mais instavel
- objetivos extras, como pegar uma pelucia especifica

## Ideias de sistemas

- moedas para comprar melhorias da garra
- skins de maquina e pelucias
- fases tematicas
- modo desafio com poucas tentativas
- ranking por pontuacao

## Direcao inicial recomendada

Para comecar pequeno, o melhor primeiro prototipo e:

- 1 maquina
- 1 tipo de garra
- 3 tipos de pelucia
- 1 tela de jogo
- 1 sistema simples de fisica
- 1 tela de vitoria e derrota

## Nome do projeto

Nome escolhido para o repositorio: `plush-claw`

## Tecnologias usadas

- HTML5 para a estrutura da interface
- CSS3 para layout responsivo, visual arcade e animacoes visuais
- JavaScript (ES Modules) para a logica do jogo
- Canvas 2D API para desenhar a maquina, a garra, os ursos e os efeitos
- LocalStorage para salvar ranking, configuracoes e progresso local

Se quiser, o proximo passo pode ser montar:

- a estrutura inicial do jogo
- a documentacao de gameplay
- um prototipo jogavel em HTML5 para celular

## Prototipo atual

O repositorio agora inclui um prototipo jogavel em HTML5:

- `index.html`
- `style.css`
- `game.js`

### Como abrir

1. Abra `index.html` no navegador.
2. No celular, voce pode abrir os arquivos por um servidor local simples ou publicar depois em um host estatico.

### O que ja existe

- 4 fases
- dificuldade baseada no tamanho da pelucia
- dificuldade baseada na firmeza da garra
- limite de tentativas
- tempo por fase
- moedas por fase concluida

### Proximo passo recomendado

Evoluir este prototipo para:

- menu inicial
- sistema de upgrades da garra
- mais tipos de pelucia
- efeitos sonoros
- animacoes melhores

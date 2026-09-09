# Documentação Técnica - NOTPONG

Bem-vindo à documentação do código-fonte do **NOTPONG**. Este documento serve como o guia definitivo para entender a arquitetura, as lógicas de física e o funcionamento geral do jogo. Ele foi estruturado para auxiliar novos desenvolvedores a compreenderem o projeto de ponta a ponta.

---

## 1. Visão Geral e Arquitetura

O **NOTPONG** foi construído utilizando **HTML5 Canvas** e **JavaScript Puro (ES6)**. Ele não depende de engines externas (como Unity, Godot ou Phaser), o que significa que o ciclo de vida do jogo, a física e a renderização foram construídos do zero.

A arquitetura do projeto segue um modelo fortemente modularizado e orientado a objetos. O princípio principal é a **Separação de Responsabilidades**: a física não mexe na tela, a tela não altera o estado, e a interface gráfica (HTML/DOM) está totalmente separada do Canvas.

### 1.1 O Game Loop (Laço Principal)
Toda a vida do jogo pulsa através do método `update` na classe `Game.js`. Este loop é alimentado pelo `requestAnimationFrame` nativo do navegador, que busca executar o código a cada quadro gerado pelo monitor. 

### 1.2 Independência de Frame Rate (Delta Time)
Um pilar essencial deste código é a independência da taxa de quadros (FPS). Todas as velocidades e lógicas não são calculadas "por quadro", mas sim **por segundo** (px/s).
- A diferença de tempo entre o quadro anterior e o atual é calculada (chamada de `deltaTimeSeconds`).
- Esse valor é passado para o motor de física (`PhysicsEngine`) e para as partículas.
- Dessa forma, o jogo roda de forma idêntica e matematicamente precisa em um monitor de 30Hz, 60Hz ou 240Hz.

---

## 2. Estrutura de Diretórios e Módulos

O código está dividido em módulos funcionais isolados na pasta `src/`:

### 📄 `main.js` (Entry Point)
Ponto de partida da aplicação. Inicializa a classe central do jogo e faz o bootstrap da arquitetura. Nenhuma regra de negócio reside aqui, apenas a injeção inicial.

---

### 📂 `config/` (Configurações e Constantes)
- **`constants.js`**: A fonte da verdade para valores estáticos. **Não há números mágicos ("Magic Numbers") espalhados pelo código.**
  - **Física:** Configurações como `BALL_MAX_SPEED` (2160 px/s), `PADDLE_SPEED` (1152 px/s) e velocidades de _Screen Shake_ (`MIN_SPEED_THRESHOLD`).
  - **Identidade Visual:** Paleta de cores (`COLORS.DAY`, `COLORS.NIGHT`) e cores hexadecimais dos Power-ups.
  - **Estados:** Um objeto Enum `GAME_STATE` mapeia os estados globais do jogo (MENU, PLAYING, PAUSED, GAME_OVER).

---

### 📂 `core/` (Lógica Central)
- **`Game.js`**: O maestro do jogo. Ele armazena o "Estado Global" (pontuações, estado atual, array de bolas e coordenadas dos blocos centrais). Chama, em ordem, os updates de `Physics`, `ParticleSystem` e `Renderer`. Gerencia o tempo de vida dos Power-Ups.
- **`InputManager.js`**: Abstrai as capturas de eventos do DOM (`keydown`, `keyup`). Mantém um dicionário booleano das teclas pressionadas (Ex: `keys.w`, `keys.ArrowUp`) para que o motor de física possa consumi-las a qualquer instante, sem depender de eventos de sistema.

---

### 📂 `physics/` (O Motor de Física)
- **`PhysicsEngine.js`**: Toda a matemática do jogo.
  - **`movePaddles`**: Atualiza a posição (Y) baseada no input e no `deltaTimeSeconds`, mantendo as raquetes contidas dentro dos limites do canvas.
  - **`moveBalls`**: Calcula a adição de vetores de velocidade (`velocityX` e `velocityY`). 
  - **Colisões**: Verifica o intersecionamento com as paredes laterais (Gol) ou limites superior/inferior. No impacto com raquetes, transfere energia e altera o `velocityY` dependendo do ponto de impacto na raquete. Toda colisão usa velocidade escalada em Segundos, jamais assumindo quadros absolutos.
  - **Colisão com a Grade Central (`handleSquareCollisions`)**: Transforma a posição (x,y) da bola para descobrir em qual célula da grade do tabuleiro ela se encontra e testa a lógica de conversão de blocos (mecânica principal do jogo).

---

### 📂 `render/` (Despejo Gráfico)
- **`Renderer.js`**: Classe estúpida e pura. Ela lê o objeto de estado passado por `Game.js` e efetua as chamadas do Contexto 2D (`ctx.fillRect`, `ctx.arc`) para pintar os blocos, raquetes e bolas na tela. Ela jamais altera valores de posições ou velocidades.
- **`ParticleSystem.js`**: Um sub-motor dedicado à beleza do impacto (Juice). Utiliza `deltaTimeSeconds` para espalhar vetores de partículas simulando pequenas explosões após cada colisão. Controla a opacidade (Alpha) e o tempo de decaimento natural para que as faíscas sumam suavemente.

---

### 📂 `ui/` (Interface do Usuário)
- **`UIManager.js`**: Ponto de integração do código central com a árvore do DOM HTML. Ele altera visibilidades (classes CSS) das janelas (Menu, Pausa, Leaderboard). Também atualiza textos como a contagem regressiva e os cronômetros, isolando todo código DOM dos cálculos rápidos do Canvas.

---

### 📂 `utils/` (Armazenamento e Utilitários)
- **`LeaderboardManager.js`**: Serializa e Desserializa dados locais do `localStorage`. Assim o jogo consegue preservar o progresso (os melhores placares e tempos do jogador no Modo 1 Jogador) mesmo após a guia ser fechada ou atualizada.

---

## 3. Práticas de Código e Manutenção

1. **Clean Code e Variáveis Significativas:**  
   Variáveis matemáticas estão nomeadas explicitamente (ex: `velocityX`, `velocityY`, `deltaTimeSeconds`). Isso torna a intenção matemática evidente sem necessidade de deduções.
   
2. **Separação Estado x Renderização:**  
   Se desejar criar um novo elemento no jogo (Ex: Um tipo novo de obstáculo), o ciclo de vida deve ser: 
   - Adicionar o obstáculo ao estado em `Game.js`.
   - Calcular a lógica de impacto dele em `PhysicsEngine.js`.
   - Adicionar o bloco de código `.fillStyle` respectivo em `Renderer.js`.
   
3. **Escalando e Ajustando Dificuldades:**
   Qualquer alteração de jogabilidade — como deixar a bola mais rápida, os efeitos mais vibrantes, os temporizadores maiores ou os blocos de bônus mais frequentes — **deve ser feita unicamente no arquivo `config/constants.js`**. O código de regra consumirá as alterações automaticamente.

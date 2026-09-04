import { CONFIG, GAME_STATE } from '../config/constants.js';
import { InputManager } from './InputManager.js';
import { UIManager } from '../ui/UIManager.js';
import { Renderer } from '../render/Renderer.js';
import { PhysicsEngine } from '../physics/PhysicsEngine.js';
import { ParticleSystem } from '../render/ParticleSystem.js';
import { LeaderboardManager } from '../utils/LeaderboardManager.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById("pongCanvas");
        if (!this.canvas) return;

        this.state = {
            numSquaresX: this.canvas.width / CONFIG.SQUARE_SIZE,
            numSquaresY: this.canvas.height / CONFIG.SQUARE_SIZE,
            dayScore: 0,
            nightScore: 0,
            timeElapsed: 0,
            currentState: GAME_STATE.MENU,
            lastTime: 0,
            gameMode: 1,
            playerName: 'Player',
            activePowerups: { bigPaddleTime: 0, bigBallTime: 0, bombBallTime: 0, rainbowTime: 0 },
            spawnTimers: { nextBonusSpawn: 5, nextRainbowSpawn: 15 },
            rainbowCoords: null,
            gridBlocks: [],
            paddleL: { x: 20, y: 0, w: CONFIG.PADDLE_WIDTH, h: CONFIG.PADDLE_HEIGHT, color: CONFIG.COLORS.DAY },
            paddleR: { x: this.canvas.width - 20 - CONFIG.PADDLE_WIDTH, y: 0, w: CONFIG.PADDLE_WIDTH, h: CONFIG.PADDLE_HEIGHT, color: CONFIG.COLORS.NIGHT },
            balls: [],
            hitPauseTimeRemaining: 0
        };

        this.input = new InputManager({
            onSpacePress: () => {
                if (this.state.currentState === GAME_STATE.GAME_OVER) this.reset();
            },
            onPausePress: () => this.togglePause()
        });

        this.ui = new UIManager(this);
        this.renderer = new Renderer(this, this.canvas);
        this.physics = new PhysicsEngine(this);
        this.particles = new ParticleSystem();

        this.update = this.update.bind(this);
        this.reset();
    }

    setMode(mode) {
        this.state.gameMode = mode;
    }

    shakeScreen(intensity = 'light', durationMs = 200) {
        const gameSection = document.querySelector('section');
        if (!gameSection) return;

        let shakeOffset = '2px';
        if (intensity === 'medium') shakeOffset = '6px';
        if (intensity === 'heavy') shakeOffset = '15px';

        gameSection.style.setProperty('--shake-x', (Math.random() > 0.5 ? '' : '-') + shakeOffset);
        gameSection.style.setProperty('--shake-y', (Math.random() > 0.5 ? '' : '-') + shakeOffset);

        gameSection.classList.remove('shake');
        void gameSection.offsetWidth;
        gameSection.classList.add('shake');

        setTimeout(() => {
            gameSection.classList.remove('shake');
        }, durationMs);
    }

    triggerHitPause(durationMs) {
        this.state.hitPauseTimeRemaining = durationMs / 1000;
    }

    togglePause() {
        if (this.state.currentState !== GAME_STATE.PLAYING && this.state.currentState !== GAME_STATE.PAUSED) return;

        if (this.state.currentState === GAME_STATE.PLAYING) {
            this.state.currentState = GAME_STATE.PAUSED;
            this.ui.showPauseScreen();
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        } else {
            this.state.currentState = GAME_STATE.PLAYING;
            this.ui.hidePauseScreen();
            this.state.lastTime = performance.now();
            this.animationId = requestAnimationFrame(this.update);
        }
    }

    reset() {
        const gameState = this.state;
        for (let col = 0; col < gameState.numSquaresX; col++) {
            gameState.gridBlocks[col] = [];
            for (let row = 0; row < gameState.numSquaresY; row++) {
                if (col === 0) gameState.gridBlocks[col][row] = CONFIG.COLORS.NIGHT;
                else gameState.gridBlocks[col][row] = col < gameState.numSquaresX / 2 ? CONFIG.COLORS.DAY : CONFIG.COLORS.NIGHT;
            }
        }
        gameState.dayScore = 0;
        gameState.nightScore = 0;
        gameState.timeElapsed = 0;
        gameState.timers = { paddle: 0, ball: 0, bomb: 0, rainbow: 0, bonusSpawn: 5, rainbowSpawn: 15 };
        gameState.rainbowCoords = null;
        gameState.paddleL.y = this.canvas.height / 2 - CONFIG.PADDLE_HEIGHT / 2;
        gameState.paddleR.y = this.canvas.height / 2 - CONFIG.PADDLE_HEIGHT / 2;
        gameState.paddleR.h = CONFIG.PADDLE_HEIGHT;
        
        if (gameState.gameMode === 1) {
            gameState.paddleL.y = 0;
            gameState.paddleL.h = this.canvas.height;
        } else {
            gameState.paddleL.y = this.canvas.height / 2 - CONFIG.PADDLE_HEIGHT / 2;
            gameState.paddleL.h = CONFIG.PADDLE_HEIGHT;
        }
        this.state.balls = [];
        this.state.hitPauseTimeRemaining = 0;
        this.state.currentState = GAME_STATE.MENU;

        this.resetBall();
        this.ui.resetMenu();
        this.ui.updateScores(0, 0);
        this.renderer.draw(this.state);
    }

    start() {
        this.state.currentState = GAME_STATE.COUNTDOWN;

        if (this.ui.elements.btn1Player) this.ui.elements.btn1Player.style.display = 'none';
        if (this.ui.elements.btn2Players) this.ui.elements.btn2Players.style.display = 'none';
        if (this.ui.elements.overlayDesc) this.ui.elements.overlayDesc.style.display = 'none';
        if (this.ui.elements.nameInputContainer) {
            this.ui.elements.nameInputContainer.classList.add('hidden');
            this.ui.elements.nameInputContainer.classList.remove('flex');
        }
        if (this.ui.elements.gameOverButtons) {
            this.ui.elements.gameOverButtons.classList.add('hidden');
            this.ui.elements.gameOverButtons.classList.remove('flex');
        }
        if (this.ui.elements.scoreboard) {
            this.ui.elements.scoreboard.classList.add('hidden');
            this.ui.elements.scoreboard.classList.remove('flex');
        }
        if (this.ui.elements.overlay) {
            this.ui.elements.overlay.classList.remove('opacity-0', 'pointer-events-none');
        }

        let count = 3;
        if (this.ui.elements.overlayTitle) {
            this.ui.elements.overlayTitle.textContent = count;
            this.ui.elements.overlayTitle.style.color = CONFIG.COLORS.DAY;
        }

        if (this.countdownInterval) clearInterval(this.countdownInterval);

        this.countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                if (this.ui.elements.overlayTitle) this.ui.elements.overlayTitle.textContent = count;
            } else if (count === 0) {
                if (this.ui.elements.overlayTitle) this.ui.elements.overlayTitle.textContent = "GO!";
            } else {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
                this.state.currentState = GAME_STATE.PLAYING;
                this.ui.hideOverlay();
                this.state.lastTime = performance.now();
                this.animationId = requestAnimationFrame(this.update);
            }
        }, 1000);
    }

    update(time) {
        if (this.state.currentState !== GAME_STATE.PLAYING) return;

        const timeDifferenceMs = time - this.state.lastTime;
        this.state.lastTime = time;
        const deltaTimeSeconds = timeDifferenceMs / 1000;

        if (this.state.hitPauseTimeRemaining > 0) {
            this.state.hitPauseTimeRemaining -= deltaTimeSeconds;
            this.renderer.draw(this.state);
            requestAnimationFrame(this.update);
            return;
        }

        this.state.timeElapsed += deltaTimeSeconds;
        this.ui.updateTimer(this.state.timeElapsed);

        this.handleTimers(deltaTimeSeconds);
        this.physics.update(deltaTimeSeconds);
        this.particles.update(deltaTimeSeconds);
        this.checkWinCondition();

        this.calculateScores();
        this.ui.updateScores(this.state.dayScore, this.state.nightScore);

        this.renderer.draw(this.state);

        if (this.state.currentState === GAME_STATE.PLAYING) {
            this.animationId = requestAnimationFrame(this.update);
        }
    }

    calculateScores() {
        if (this.state.gameMode === 1) {
            let dayScore = 0;
            let nightScore = 0;
            const gridBlocks = this.state.gridBlocks;
            for (let col = 0; col < this.state.numSquaresX; col++) {
                for (let row = 0; row < this.state.numSquaresY; row++) {
                    const color = gridBlocks[col][row];
                    if (color === CONFIG.COLORS.DAY) dayScore++;
                    else if (color === CONFIG.COLORS.NIGHT) nightScore++;
                }
            }
            this.state.dayScore = dayScore;
            this.state.nightScore = nightScore;
        }
    }

    handleTimers(deltaTimeSeconds) {
        this._updatePowerupsTimers(deltaTimeSeconds);

        if (this.state.gameMode === 1) {
            this._handleRainbowSpawn(deltaTimeSeconds);
            this._handleBonusSpawn(deltaTimeSeconds);
        }
    }

    _updatePowerupsTimers(deltaTimeSeconds) {
        const activeTimers = this.state.activePowerups;

        if (activeTimers.bigPaddleTime > 0) { 
            activeTimers.bigPaddleTime -= deltaTimeSeconds;
            this.state.paddleR.h = CONFIG.PADDLE_HEIGHT * 3;
        } else {
            this.state.paddleR.h = CONFIG.PADDLE_HEIGHT;
        }

        if (activeTimers.bigBallTime > 0) {
            activeTimers.bigBallTime -= deltaTimeSeconds;
            this.state.balls.forEach(ball => ball.radius = CONFIG.BALL_SIZE * 2);
        } else {
            this.state.balls.forEach(ball => ball.radius = CONFIG.BALL_SIZE);
        }

        if (activeTimers.bombBallTime > 0) activeTimers.bombBallTime -= deltaTimeSeconds;

        this.ui.updatePowerups(activeTimers);
    }

    _handleRainbowSpawn(deltaTimeSeconds) {
        const RAINBOW_BASE_SPAWN_TIME = 30;
        const RAINBOW_RANDOM_SPAWN_EXTRA = 30;
        
        this.state.spawnTimers.nextRainbowSpawn -= deltaTimeSeconds;
        if (this.state.spawnTimers.nextRainbowSpawn <= 0 && !this.state.rainbowCoords) {
            this.state.spawnTimers.nextRainbowSpawn = RAINBOW_BASE_SPAWN_TIME + Math.random() * RAINBOW_RANDOM_SPAWN_EXTRA;
            const nightBlocks = [];
            for (let col = 1; col < this.state.numSquaresX - 1; col++) {
                for (let row = 1; row < this.state.numSquaresY - 1; row++) {
                    if (this.state.gridBlocks[col][row] === CONFIG.COLORS.NIGHT) nightBlocks.push({ col, row });
                }
            }
            if (nightBlocks.length > 0) {
                const pick = nightBlocks[Math.floor(Math.random() * nightBlocks.length)];
                this.state.gridBlocks[pick.col][pick.row] = CONFIG.BONUS_COLORS.RAINBOW;
                this.state.rainbowCoords = pick;
                this.state.activePowerups.rainbow = CONFIG.RAINBOW_BLOCK_DURATION_MS / 1000;
            }
        }

        const activeTimers = this.state.activePowerups;
        if (activeTimers.rainbow > 0) {
            activeTimers.rainbow -= deltaTimeSeconds;
            if (activeTimers.rainbow <= 0 && this.state.rainbowCoords) {
                if (this.state.gridBlocks[this.state.rainbowCoords.col][this.state.rainbowCoords.row] === CONFIG.BONUS_COLORS.RAINBOW) {
                    this.state.gridBlocks[this.state.rainbowCoords.col][this.state.rainbowCoords.row] = CONFIG.COLORS.NIGHT;
                }
                this.state.rainbowCoords = null;
            }
        }
    }

    _handleBonusSpawn(deltaTimeSeconds) {
        const BONUS_BASE_SPAWN_TIME = 10;
        const BONUS_RANDOM_SPAWN_EXTRA = 15;

        this.state.spawnTimers.nextBonusSpawn -= deltaTimeSeconds;
        if (this.state.spawnTimers.nextBonusSpawn <= 0) {
            this.state.spawnTimers.nextBonusSpawn = BONUS_BASE_SPAWN_TIME + Math.random() * BONUS_RANDOM_SPAWN_EXTRA;
            const nightBlocks = [];
            let currentBonusCount = 0;
            for (let col = 1; col < this.state.numSquaresX - 1; col++) {
                for (let row = 1; row < this.state.numSquaresY - 1; row++) {
                    const blockColor = this.state.gridBlocks[col][row];
                    if (blockColor === CONFIG.COLORS.NIGHT) nightBlocks.push({ col, row });
                    else if (Object.values(CONFIG.BONUS_COLORS).includes(blockColor)) currentBonusCount++;
                }
            }
            if (currentBonusCount < 2 && nightBlocks.length > 0) {
                const pick = nightBlocks[Math.floor(Math.random() * nightBlocks.length)];
                const rand = Math.random();
                if (rand < 0.25) this.state.gridBlocks[pick.col][pick.row] = CONFIG.BONUS_COLORS.BIG_PADDLE;
                else if (rand < 0.50) this.state.gridBlocks[pick.col][pick.row] = CONFIG.BONUS_COLORS.BIG_BALL;
                else if (rand < 0.75) this.state.gridBlocks[pick.col][pick.row] = CONFIG.BONUS_COLORS.MULTI_BALL;
                else this.state.gridBlocks[pick.col][pick.row] = CONFIG.BONUS_COLORS.BOMB_BALL;
            }
        }
    }

    checkWinCondition() {
        if (this.state.gameMode === 1) {
            this._checkSinglePlayerWinCondition();
        } else {
            this._checkMultiplayerWinCondition();
        }
    }

    _checkSinglePlayerWinCondition() {
        this.calculateScores();
        if (this.state.dayScore === 0) {
            this.state.currentState = GAME_STATE.GAME_OVER;
            const leaderboardData = LeaderboardManager.add(this.state.playerName, this.state.timeElapsed);
            this.ui.showGameOver("VOCÊ VENCEU!", CONFIG.COLORS.DAY, true, leaderboardData);
            return;
        }

        let rightmostDayColumn = -1;
        for (let col = 0; col < this.state.numSquaresX; col++) {
            for (let row = 0; row < this.state.numSquaresY; row++) {
                if (this.state.gridBlocks[col][row] === CONFIG.COLORS.DAY && col > rightmostDayColumn) rightmostDayColumn = col;
            }
        }
        if (rightmostDayColumn >= this.state.numSquaresX - 2) {
            this.state.currentState = GAME_STATE.GAME_OVER;
            this.ui.showGameOver("FIM DE JOGO", CONFIG.COLORS.DAY, false);
        }
    }

    _checkMultiplayerWinCondition() {
        const WINNING_SCORE = 10;
        if (this.state.dayScore >= WINNING_SCORE || this.state.nightScore >= WINNING_SCORE) {
            this.state.currentState = GAME_STATE.GAME_OVER;
            if (this.state.dayScore >= WINNING_SCORE) {
                this.ui.showGameOver("JOGADOR 1 VENCEU", CONFIG.COLORS.DAY, false);
            } else {
                this.ui.showGameOver("JOGADOR 2 VENCEU", "#FF0033", false);
            }
        }
    }

    resetBall(directionX = null) {
        const state = this.state;
        
        let startX = this.canvas.width / 2;
        let startY = this.canvas.height / 2;
        let dx = CONFIG.BALL_INITIAL_SPEED;

        const radius = state.activePowerups && state.activePowerups.bigBallTime > 0 ? CONFIG.BALL_SIZE * 2 : CONFIG.BALL_SIZE;

        if (state.gameMode === 1) {
            let rightmostColumn = -1;
            for (let col = 0; col < state.numSquaresX; col++) {
                for (let row = 0; row < state.numSquaresY; row++) {
                    if (state.gridBlocks[col][row] === CONFIG.COLORS.DAY && col > rightmostColumn) rightmostColumn = col;
                }
            }
            if (rightmostColumn !== -1) {
                startX = (rightmostColumn + 1) * CONFIG.SQUARE_SIZE + radius * 3;
                startX = Math.min(startX, state.paddleR.x - radius - 5);
            }
        } else {
            dx = directionX ? directionX * CONFIG.BALL_INITIAL_SPEED : (Math.random() > 0.5 ? 1 : -1) * CONFIG.BALL_INITIAL_SPEED;
        }

        const dy = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 2 + 1);
        const owner = state.gameMode === 1 ? CONFIG.COLORS.NIGHT : CONFIG.COLORS.NEUTRAL;

        state.balls = [{
            x: startX,
            y: startY,
            dx: dx,
            dy: dy,
            radius: radius,
            owner: owner,
            trail: []
        }];
    }

    advanceTerritory(winnerColor) {
        const state = this.state;
        const gridColumns = state.numSquaresX;
        const gridRows = state.numSquaresY;

        if (winnerColor === CONFIG.COLORS.DAY) {
            let rightmostColumn = -1;
            for (let col = 0; col < gridColumns; col++) {
                for (let row = 0; row < gridRows; row++) {
                    if (state.gridBlocks[col][row] === CONFIG.COLORS.DAY && col > rightmostColumn) rightmostColumn = col;
                }
            }
            for (let col = rightmostColumn + 1; col <= rightmostColumn + 2; col++) {
                for (let row = 0; row < gridRows; row++) {
                    if (col >= 0 && col < gridColumns) state.gridBlocks[col][row] = CONFIG.COLORS.DAY;
                }
            }
        } else if (winnerColor === CONFIG.COLORS.NIGHT) {
            let leftmostColumn = gridColumns;
            for (let col = 0; col < gridColumns; col++) {
                for (let row = 0; row < gridRows; row++) {
                    if (state.gridBlocks[col][row] === CONFIG.COLORS.NIGHT && col < leftmostColumn) leftmostColumn = col;
                }
            }
            for (let col = leftmostColumn - 1; col >= leftmostColumn - 2; col--) {
                for (let row = 0; row < gridRows; row++) {
                    if (col > 0 && col < gridColumns) state.gridBlocks[col][row] = CONFIG.COLORS.NIGHT;
                }
            }
        }
    }

    handleBallOut(isLeft, ballIndex) {
        const state = this.state;
        state.balls.splice(ballIndex, 1);

        if (state.gameMode === 1) {
            if (state.balls.length === 0) {
                this.advanceTerritory(CONFIG.COLORS.DAY);
                this.resetBall();
            }
        } else {
            if (isLeft) {
                state.nightScore++;
            } else {
                state.dayScore++;
            }
            this.ui.updateScores(state.dayScore, state.nightScore);
            if (state.balls.length === 0) {
                this.resetBall(isLeft ? 1 : -1);
            }
        }
    }

    handleBlockHit(gridX, gridY, ball, hitColor) {
        const state = this.state;
        state.gridBlocks[gridX][gridY] = ball.owner;
        this.particles.spawn(ball.x, ball.y, ball.owner, CONFIG.PARTICLES.BLOCK_HIT_COUNT, CONFIG.PARTICLES.BLOCK_HIT_SPEED, CONFIG.PARTICLES.BLOCK_HIT_SIZE);

        if (hitColor === CONFIG.BONUS_COLORS.BIG_PADDLE) state.activePowerups.bigPaddleTime = 10;
        if (hitColor === CONFIG.BONUS_COLORS.BIG_BALL) state.activePowerups.bigBallTime = 10;
        if (hitColor === CONFIG.BONUS_COLORS.BOMB_BALL) this.activateBombPowerup(ball);
        if (hitColor === CONFIG.BONUS_COLORS.RAINBOW) this.activateRainbowPowerup(ball.owner);
        
        let newBalls = [];
        if (hitColor === CONFIG.BONUS_COLORS.MULTI_BALL) {
            newBalls.push(
                { ...ball, trail: [], dy: ball.dy - 3, dx: ball.dx * 1.05 },
                { ...ball, trail: [], dy: ball.dy + 3, dx: ball.dx * 1.05 }
            );
            this.shakeScreen('medium');
        }

        if (state.activePowerups.bombBallTime > 0) {
            this.applyBombExplosion(gridX, gridY, ball.owner);
        }

        return newBalls;
    }

    activateBombPowerup(ball) {
        this.state.activePowerups.bombBallTime = 10;
        this.shakeScreen('heavy', CONFIG.SHAKE.HEAVY_DURATION_MS);
        this.particles.spawn(ball.x, ball.y, '#ff00ff', CONFIG.PARTICLES.BOMB_HIT_COUNT, CONFIG.PARTICLES.BOMB_HIT_SPEED, CONFIG.PARTICLES.BOMB_HIT_SIZE);
        this.triggerHitPause(50);
    }

    activateRainbowPowerup(ballOwner) {
        const state = this.state;
        state.rainbowCoords = null;
        for (let gridX = 0; gridX < state.numSquaresX; gridX++) {
            for (let gridY = 0; gridY < state.numSquaresY; gridY++) {
                if (state.gridBlocks[gridX][gridY] === CONFIG.COLORS.DAY) {
                    state.gridBlocks[gridX][gridY] = ballOwner;
                    this.particles.spawn(gridX * CONFIG.SQUARE_SIZE + 10, gridY * CONFIG.SQUARE_SIZE + 10, ballOwner, CONFIG.PARTICLES.RAINBOW_HIT_COUNT, CONFIG.PARTICLES.RAINBOW_HIT_SPEED, CONFIG.PARTICLES.RAINBOW_HIT_SIZE);
                }
            }
        }
    }

    applyBombExplosion(gridX, gridY, ballOwner) {
        const state = this.state;
        for (let offsetX = -2; offsetX <= 2; offsetX++) {
            for (let offsetY = -2; offsetY <= 2; offsetY++) {
                const neighborX = gridX + offsetX;
                const neighborY = gridY + offsetY;
                if (neighborX >= 0 && neighborX < state.numSquaresX && neighborY >= 0 && neighborY < state.numSquaresY) {
                    if (state.gridBlocks[neighborX][neighborY] !== ballOwner && state.gridBlocks[neighborX][neighborY] !== CONFIG.COLORS.NEUTRAL) {
                        state.gridBlocks[neighborX][neighborY] = ballOwner;
                    }
                }
            }
        }
    }
}

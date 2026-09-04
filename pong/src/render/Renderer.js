import { CONFIG } from '../config/constants.js';

export class Renderer {
    constructor(game, canvas) {
        this.game = game;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    draw(state) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (state.gameMode === 1) {
            this.drawSquares(state);
        } else {
            this.ctx.fillStyle = CONFIG.COLORS.NIGHT;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.setLineDash([15, 15]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.canvas.width / 2, 0);
            this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
            this.ctx.strokeStyle = CONFIG.COLORS.NEUTRAL;
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        this.drawPaddles(state);
        this.drawBalls(state);
        this.game.particles.draw(this.ctx);
    }

    drawSquares(state) {
        for (let col = 0; col < state.numSquaresX; col++) {
            for (let row = 0; row < state.numSquaresY; row++) {
                const blockColor = state.gridBlocks[col][row];
                if (blockColor === CONFIG.BONUS_COLORS.RAINBOW) {
                    this.drawRainbowBlock(col, row);
                } else {
                    this.ctx.fillStyle = blockColor;
                    this.ctx.fillRect(col * CONFIG.SQUARE_SIZE, row * CONFIG.SQUARE_SIZE, CONFIG.SQUARE_SIZE, CONFIG.SQUARE_SIZE);
                }
            }
        }
    }

    drawRainbowBlock(col, row) {
        this.ctx.save();
        this.ctx.translate(col * CONFIG.SQUARE_SIZE + CONFIG.SQUARE_SIZE / 2, row * CONFIG.SQUARE_SIZE + CONFIG.SQUARE_SIZE / 2);
        this.ctx.rotate((performance.now() / 500) % (Math.PI * 2));

        const hue = (performance.now() / 15) % 360;
        this.ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        this.ctx.shadowBlur = 15;

        const grad = this.ctx.createLinearGradient(-CONFIG.SQUARE_SIZE / 2, -CONFIG.SQUARE_SIZE / 2, CONFIG.SQUARE_SIZE / 2, CONFIG.SQUARE_SIZE / 2);
        grad.addColorStop(0, 'red');
        grad.addColorStop(0.16, 'orange');
        grad.addColorStop(0.33, 'yellow');
        grad.addColorStop(0.5, 'lime');
        grad.addColorStop(0.66, 'blue');
        grad.addColorStop(0.83, 'magenta');
        grad.addColorStop(1, 'red');

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.roundRect(-CONFIG.SQUARE_SIZE / 2.2, -CONFIG.SQUARE_SIZE / 2.2, CONFIG.SQUARE_SIZE * 0.9, CONFIG.SQUARE_SIZE * 0.9, 6);
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -CONFIG.SQUARE_SIZE / 3);
        this.ctx.lineTo(CONFIG.SQUARE_SIZE / 8, -CONFIG.SQUARE_SIZE / 8);
        this.ctx.lineTo(CONFIG.SQUARE_SIZE / 3, 0);
        this.ctx.lineTo(CONFIG.SQUARE_SIZE / 8, CONFIG.SQUARE_SIZE / 8);
        this.ctx.lineTo(0, CONFIG.SQUARE_SIZE / 3);
        this.ctx.lineTo(-CONFIG.SQUARE_SIZE / 8, CONFIG.SQUARE_SIZE / 8);
        this.ctx.lineTo(-CONFIG.SQUARE_SIZE / 3, 0);
        this.ctx.lineTo(-CONFIG.SQUARE_SIZE / 8, -CONFIG.SQUARE_SIZE / 8);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    drawPaddles(state) {
        if (state.gameMode !== 1) {
            this.ctx.fillStyle = state.paddleL.color;
            this.ctx.fillRect(state.paddleL.x, state.paddleL.y, state.paddleL.w, state.paddleL.h);
        }

        if (state.activePowerups.bigPaddleTime > 0) {
            this.ctx.fillStyle = CONFIG.BONUS_COLORS.BIG_PADDLE;
            this.ctx.strokeStyle = CONFIG.BONUS_COLORS.BIG_PADDLE;
        } else {
            this.ctx.fillStyle = state.paddleR.color;
            this.ctx.strokeStyle = '#ffffff';
        }
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(state.paddleR.x, state.paddleR.y, state.paddleR.w, state.paddleR.h);
        this.ctx.strokeRect(state.paddleR.x, state.paddleR.y, state.paddleR.w, state.paddleR.h);
    }

    _getBallTrailColor(owner, state) {
        if (state.activePowerups.bombBallTime > 0) return '255, 0, 255';
        if (state.activePowerups.bigBallTime > 0) return '57, 255, 20';
        if (owner === CONFIG.COLORS.DAY) return '226, 232, 240';
        return '255, 0, 51';
    }

    _getBallFillColor(owner, state) {
        if (state.activePowerups.bombBallTime > 0) return CONFIG.BONUS_COLORS.BOMB_BALL;
        if (state.activePowerups.bigBallTime > 0) return CONFIG.BONUS_COLORS.BIG_BALL;
        if (owner === CONFIG.COLORS.DAY) return CONFIG.COLORS.DAY;
        return '#FF0033';
    }

    drawBalls(state) {
        for (const ball of state.balls) {
            if (ball.trail && ball.trail.length > 0) {
                for (let i = 0; i < ball.trail.length; i++) {
                    const pos = ball.trail[i];
                    const opacity = (i / ball.trail.length) * 0.5;
                    const trailRadius = ball.radius * (0.3 + (i / ball.trail.length) * 0.7);

                    this.ctx.beginPath();
                    this.ctx.arc(pos.x, pos.y, trailRadius, 0, Math.PI * 2, false);
                    this.ctx.fillStyle = `rgba(${this._getBallTrailColor(pos.owner, state)}, ${opacity})`;
                    this.ctx.fill();
                    this.ctx.closePath();
                }
            }

            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, false);
            this.ctx.fillStyle = this._getBallFillColor(ball.owner, state);
            this.ctx.fill();
            this.ctx.closePath();
        }
    }
}

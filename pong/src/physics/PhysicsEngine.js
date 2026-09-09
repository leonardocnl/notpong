import { CONFIG } from '../config/constants.js';

export class PhysicsEngine {
    constructor(game) {
        this.game = game;
    }

    update(deltaTimeSeconds) {
        this.movePaddles(deltaTimeSeconds);
        this.moveBalls(deltaTimeSeconds);
        if (this.game.state.gameMode === 1) {
            this.handleSquareCollisions();
        }
    }

    movePaddles(deltaTimeSeconds) {
        const state = this.game.state;
        const keys = this.game.input.keys;
        const canvasHeight = this.game.canvas.height;

        if (keys.ArrowUp) state.paddleR.y -= CONFIG.PADDLE_SPEED * deltaTimeSeconds;
        if (keys.ArrowDown) state.paddleR.y += CONFIG.PADDLE_SPEED * deltaTimeSeconds;
        state.paddleR.y = Math.max(0, Math.min(canvasHeight - state.paddleR.h, state.paddleR.y));

        if (state.gameMode !== 1) {
            if (keys.w) state.paddleL.y -= CONFIG.PADDLE_SPEED * deltaTimeSeconds;
            if (keys.s) state.paddleL.y += CONFIG.PADDLE_SPEED * deltaTimeSeconds;
            state.paddleL.y = Math.max(0, Math.min(canvasHeight - state.paddleL.h, state.paddleL.y));
        }
    }

    _handleVerticalWallBounces(ball, canvasHeight) {
        if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.velocityY = -ball.velocityY;
        } else if (ball.y + ball.radius >= canvasHeight) {
            ball.y = canvasHeight - ball.radius;
            ball.velocityY = -ball.velocityY;
        }
    }

    _handlePaddleCollision(ball, paddle, isLeft, speedMultiplier) {
        const checkLeft = isLeft ? ball.velocityX < 0 && ball.x - ball.radius <= paddle.x + paddle.w : false;
        const checkRight = !isLeft ? ball.velocityX > 0 && ball.x + ball.radius >= paddle.x : false;

        if ((checkLeft || checkRight) && ball.y + ball.radius >= paddle.y && ball.y - ball.radius <= paddle.y + paddle.h) {
            ball.velocityX = (isLeft ? Math.abs(ball.velocityX) : -Math.abs(ball.velocityX)) * speedMultiplier;
            
            if (Math.abs(ball.velocityX) > CONFIG.SHAKE.MIN_SPEED_THRESHOLD) {
                this.game.triggerHitPause(30);
                this.game.shakeScreen('medium', CONFIG.SHAKE.LIGHT_DURATION_MS);
            } else {
                this.game.shakeScreen('light', CONFIG.SHAKE.LIGHT_DURATION_MS);
            }

            this.game.particles.spawn(ball.x, ball.y, isLeft ? CONFIG.COLORS.DAY : CONFIG.COLORS.NIGHT, CONFIG.PARTICLES.PADDLE_HIT_COUNT, CONFIG.PARTICLES.PADDLE_HIT_SPEED, CONFIG.PARTICLES.PADDLE_HIT_SIZE);
            if (!isLeft || this.game.state.gameMode !== 1) {
                ball.owner = isLeft ? CONFIG.COLORS.DAY : CONFIG.COLORS.NIGHT;
            }
            const hitPoint = (ball.y - (paddle.y + paddle.h / 2)) / (paddle.h / 2);
            ball.velocityY = hitPoint * Math.abs(ball.velocityX);
        }
    }

    moveBalls(deltaTimeSeconds) {
        const state = this.game.state;
        const canvasWidth = this.game.canvas.width;
        const canvasHeight = this.game.canvas.height;
        const isSinglePlayer = state.gameMode === 1;
        const speedMultiplier = isSinglePlayer ? CONFIG.BALL_SPEED_MULTIPLIER_SP : CONFIG.BALL_SPEED_MULTIPLIER_MP;

        for (let i = state.balls.length - 1; i >= 0; i--) {
            const ball = state.balls[i];

            ball.trail.push({ x: ball.x, y: ball.y, owner: ball.owner });
            if (ball.trail.length > CONFIG.TRAIL_LENGTH) {
                ball.trail.shift();
            }

            ball.x += ball.velocityX * deltaTimeSeconds;
            ball.y += ball.velocityY * deltaTimeSeconds;

            this._handleVerticalWallBounces(ball, canvasHeight);

            if (ball.x - ball.radius <= 0) {
                if (isSinglePlayer) {
                    ball.x = ball.radius;
                    ball.velocityX = -ball.velocityX;
                } else {
                    this.game.handleBallOut(true, i);
                    continue;
                }
            } else if (ball.x + ball.radius >= canvasWidth) {
                this.game.handleBallOut(false, i);
                continue;
            }

            this._handlePaddleCollision(ball, state.paddleL, true, speedMultiplier);
            this._handlePaddleCollision(ball, state.paddleR, false, speedMultiplier);

            ball.velocityX = Math.min(Math.max(ball.velocityX, -CONFIG.BALL_MAX_SPEED), CONFIG.BALL_MAX_SPEED);
        }
    }


    handleSquareCollisions() {
        const state = this.game.state;
        
        let newBallsToAdd = [];

        for (let ball of state.balls) {
            if (ball.owner === CONFIG.COLORS.NEUTRAL) continue;

            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                const checkX = ball.x + Math.cos(angle) * ball.radius;
                const checkY = ball.y + Math.sin(angle) * ball.radius;
                const gridX = Math.floor(checkX / CONFIG.SQUARE_SIZE);
                const gridY = Math.floor(checkY / CONFIG.SQUARE_SIZE);

                if (gridX >= 0 && gridX < state.numSquaresX && gridY >= 0 && gridY < state.numSquaresY) {
                    if (state.gridBlocks[gridX][gridY] !== ball.owner) {
                        const hitColor = state.gridBlocks[gridX][gridY];
                        const newBalls = this.game.handleBlockHit(gridX, gridY, ball, hitColor);
                        if (newBalls && newBalls.length > 0) newBallsToAdd.push(...newBalls);

                        const isBonus = Object.values(CONFIG.BONUS_COLORS).includes(hitColor);

                        if (!isBonus && Math.random() > 0.8) {
                            if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) ball.velocityX = -ball.velocityX;
                            else ball.velocityY = -ball.velocityY;
                        }
                    }
                }
            }
        }
        
        if (newBallsToAdd.length > 0) {
            state.balls.push(...newBallsToAdd);
        }
    }
}

export class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = {
            scoreDay: document.getElementById("scoreDay"),
            scoreNight: document.getElementById("scoreNight"),
            timerDisplay: document.getElementById("timerDisplay"),
            overlay: document.getElementById('overlay'),
            overlayTitle: document.getElementById('overlayTitle'),
            overlayDesc: document.getElementById('overlayDesc'),
            btn1Player: document.getElementById('btn1Player'),
            btn2Players: document.getElementById('btn2Players'),
            p1Label: document.getElementById('p1Label'),
            p2Label: document.getElementById('p2Label'),
            controlsHint: document.getElementById('controlsHint'),
            modeButtons: document.getElementById('modeButtons'),
            nameInputContainer: document.getElementById('nameInputContainer'),
            playerNameInput: document.getElementById('playerNameInput'),
            btnStartSingle: document.getElementById('btnStartSingle'),
            btnPlayAgain: document.getElementById('btnPlayAgain'),
            btnBackToMenu: document.getElementById('btnBackToMenu'),
            btnTopBack: document.getElementById('btnTopBack'),
            gameOverButtons: document.getElementById('gameOverButtons'),
            uiBigPaddle: document.getElementById('uiBigPaddle'),
            timeBigPaddle: document.getElementById('timeBigPaddle'),
            uiBigBall: document.getElementById('uiBigBall'),
            timeBigBall: document.getElementById('timeBigBall'),
            uiBombBall: document.getElementById('uiBombBall'),
            timeBombBall: document.getElementById('timeBombBall'),
            pauseOverlay: document.getElementById('pauseOverlay'),
            scoreboard: document.getElementById('scoreboard'),
            scoreboardList: document.getElementById('scoreboardList')
        };
        this.bindEvents();
    }

    _showFlex(element) {
        if (element) {
            element.classList.remove('hidden');
            element.classList.add('flex');
            element.style.display = '';
        }
    }
    _hide(element) {
        if (element) {
            element.classList.remove('flex');
            element.classList.add('hidden');
            element.style.display = 'none';
        }
    }
    _showBlock(element) {
        if (element) {
            element.classList.remove('hidden');
            element.style.display = 'block';
        }
    }

    bindEvents() {
        if (this.elements.btn1Player) {
            this.elements.btn1Player.addEventListener('click', () => {
                this._hide(this.elements.modeButtons);
                this._showFlex(this.elements.nameInputContainer);
                this.elements.overlayTitle.textContent = "INFORME SEU NOME";
                this.elements.playerNameInput.focus();
            });
        }
        if (this.elements.btnStartSingle) {
            this.elements.btnStartSingle.addEventListener('click', () => {
                let name = this.elements.playerNameInput.value;
                this.game.state.playerName = name ? name.trim() : "Jogador";
                if (this.game.state.playerName === "") this.game.state.playerName = "Jogador";
                this.game.setMode(1);
                this.elements.p1Label.textContent = 'CPU';
                this.elements.p2Label.textContent = 'Jogador';
                this.elements.controlsHint.textContent = 'Controles: CIMA/BAIXO';
                this.elements.timerDisplay.style.visibility = 'visible';
                this.game.reset();
                this.game.start();
            });
        }
        if (this.elements.playerNameInput) {
            this.elements.playerNameInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') this.elements.btnStartSingle.click();
            });
        }
        if (this.elements.btn2Players) {
            this.elements.btn2Players.addEventListener('click', () => {
                this.game.setMode(2);
                this.elements.p1Label.textContent = 'Jogador 1';
                this.elements.p2Label.textContent = 'Jogador 2';
                this.elements.controlsHint.textContent = 'P1: W/S | P2: CIMA/BAIXO';
                this.elements.timerDisplay.style.visibility = 'visible';
                this.game.reset();
                this.game.start();
            });
        }
        if (this.elements.btnPlayAgain) {
            this.elements.btnPlayAgain.addEventListener('click', () => {
                this.game.reset();
                this.game.start();
            });
        }
        if (this.elements.btnBackToMenu) {
            this.elements.btnBackToMenu.addEventListener('click', () => {
                this.game.reset();
            });
        }
        if (this.elements.btnTopBack) {
            this.elements.btnTopBack.addEventListener('click', (event) => {
                event.preventDefault();

                if (!this.elements.nameInputContainer.classList.contains('hidden')) {
                    this._hide(this.elements.nameInputContainer);
                    this._showFlex(this.elements.modeButtons);
                    this.elements.overlayTitle.textContent = "ESCOLHA O MODO";
                    return;
                }

                this.game.state.currentState = 'MENU';
                if (this.game.countdownInterval) clearInterval(this.game.countdownInterval);
                if (this.game.animationId) {
                    cancelAnimationFrame(this.game.animationId);
                }

                window.location.href = '../index.html';
            });
        }
    }

    resetMenu() {
        if (this.elements.scoreboard) this._hide(this.elements.scoreboard);
        if (this.elements.overlayDesc) this.elements.overlayDesc.style.display = 'block';
        if (this.elements.overlayTitle) {
            this.elements.overlayTitle.textContent = "ESCOLHA O MODO";
            this.elements.overlayTitle.style.color = '#ffffff';
        }
        if (this.elements.btn1Player) this._showBlock(this.elements.btn1Player);
        if (this.elements.btn2Players) this._showBlock(this.elements.btn2Players);

        if (this.elements.modeButtons) this._showFlex(this.elements.modeButtons);
        if (this.elements.nameInputContainer) this._hide(this.elements.nameInputContainer);
        if (this.elements.gameOverButtons) this._hide(this.elements.gameOverButtons);
        if (this.elements.timerDisplay) {
            this.elements.timerDisplay.textContent = "0.00s";
            this.elements.timerDisplay.style.visibility = 'visible';
        }
    }

    updateScores(dayScore, nightScore) {
        if (this.elements.scoreDay) this.elements.scoreDay.textContent = dayScore;
        if (this.elements.scoreNight) {
            this.elements.scoreNight.textContent = nightScore;
            this.elements.scoreNight.style.color = nightScore > dayScore ? '#ffffff' : '#222222';
        }
    }

    updateTimer(timeElapsed) {
        if (this.elements.timerDisplay) this.elements.timerDisplay.textContent = timeElapsed.toFixed(2) + 's';
    }

    updatePowerups(timers) {
        const powerupList = [
            { timeLeft: timers.paddle, uiElement: this.elements.uiBigPaddle, textElement: this.elements.timeBigPaddle },
            { timeLeft: timers.ball, uiElement: this.elements.uiBigBall, textElement: this.elements.timeBigBall },
            { timeLeft: timers.bomb, uiElement: this.elements.uiBombBall, textElement: this.elements.timeBombBall }
        ];
        powerupList.forEach(powerupItem => {
            if (!powerupItem.uiElement) return;
            if (powerupItem.timeLeft > 0) {
                powerupItem.uiElement.classList.remove('opacity-0');
                powerupItem.uiElement.classList.add('opacity-100');
                if (powerupItem.textElement) powerupItem.textElement.textContent = powerupItem.timeLeft.toFixed(1);
            } else {
                powerupItem.uiElement.classList.remove('opacity-100');
                powerupItem.uiElement.classList.add('opacity-0');
            }
        });
    }

    showGameOver(title, color, isWin, leaderboard = null) {
        if (this.elements.overlay) this.elements.overlay.classList.remove('opacity-0', 'pointer-events-none');
        if (this.elements.btn1Player) this.elements.btn1Player.style.display = 'none';
        if (this.elements.btn2Players) this.elements.btn2Players.style.display = 'none';
        if (this.elements.overlayDesc) this.elements.overlayDesc.style.display = 'none';

        if (this.elements.nameInputContainer) {
            this._hide(this.elements.nameInputContainer);
        }
        if (this.elements.gameOverButtons) {
            this._showFlex(this.elements.gameOverButtons);
        }

        if (this.elements.overlayTitle) {
            this.elements.overlayTitle.textContent = title;
            this.elements.overlayTitle.style.color = color;
        }

        if (leaderboard && this.elements.scoreboard && this.elements.scoreboardList) {
            this._showFlex(this.elements.scoreboard);
            this.elements.scoreboardList.innerHTML = leaderboard.map((entry, index) =>
                `<div class="flex justify-between w-full" style="border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 0.25rem;">
                <span>${index + 1}. ${entry.name}</span>
                <span>${entry.time.toFixed(2)}s</span>
            </div>`
            ).join('');
        }
    }

    hideOverlay() {
        if (this.elements.overlay) this.elements.overlay.classList.add('opacity-0', 'pointer-events-none');
    }

    showPauseScreen() {
        if (this.elements.pauseOverlay) this._showFlex(this.elements.pauseOverlay);
    }

    hidePauseScreen() {
        if (this.elements.pauseOverlay) this._hide(this.elements.pauseOverlay);
    }
}

import { Game } from './core/Game.js';

window.addEventListener('DOMContentLoaded', () => {
    try {
        window.game = new Game();
    } catch (error) {
        const errorContainer = document.createElement('div');
        errorContainer.style.position = 'fixed';
        errorContainer.style.top = '0';
        errorContainer.style.left = '0';
        errorContainer.style.zIndex = '9999';
        errorContainer.style.color = 'red';
        errorContainer.style.backgroundColor = 'black';
        errorContainer.style.padding = '20px';
        errorContainer.style.fontSize = '24px';
        errorContainer.innerHTML = "ERROR: " + error.message + "<br>" + error.stack;
        document.body.appendChild(errorContainer);
    }
});

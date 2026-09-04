export class InputManager {
    constructor(callbacks) {
        this.keys = { w: false, s: false, ArrowUp: false, ArrowDown: false };
        this.onSpacePress = callbacks?.onSpacePress;
        this.onPausePress = callbacks?.onPausePress;
        this.bindEvents();
    }
    bindEvents() {
        document.addEventListener('keydown', (event) => {
            if (event.key === ' ' || event.code === 'Space') {
                if (this.onSpacePress) this.onSpacePress();
            }
            if (event.key === 'Escape' || event.key === 'p' || event.key === 'P') {
                if (this.onPausePress) this.onPausePress();
            }
            let pressedKey = event.key;
            if (pressedKey === 'W') pressedKey = 'w';
            if (pressedKey === 'S') pressedKey = 's';
            if (this.keys.hasOwnProperty(pressedKey)) this.keys[pressedKey] = true;
        });
        document.addEventListener('keyup', (event) => {
            let pressedKey = event.key;
            if (pressedKey === 'W') pressedKey = 'w';
            if (pressedKey === 'S') pressedKey = 's';
            if (this.keys.hasOwnProperty(pressedKey)) this.keys[pressedKey] = false;
        });
    }
}

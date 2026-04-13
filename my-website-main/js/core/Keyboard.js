export class KeyboardManager {
    constructor() {
        this.shortcuts = new Map();
        this.initGlobalListener();
    }

    register(keyCombo, callback) {
        this.shortcuts.set(keyCombo.toLowerCase(), callback);
    }

    initGlobalListener() {
        document.addEventListener('keydown', (e) => {
            const target = e.target;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
            
            let keyCombo = [];
            if (e.ctrlKey) keyCombo.push('ctrl');
            if (e.altKey) keyCombo.push('alt');
            if (e.shiftKey) keyCombo.push('shift');
            
            if (e.key.length === 1) {
                keyCombo.push(e.key.toLowerCase());
            } else {
                keyCombo.push(e.key.toLowerCase());
            }
            
            const comboString = keyCombo.join('+');


            if (isInput) {
                if (!e.ctrlKey && !e.altKey && e.key.length === 1) return; 
            }

            if (this.shortcuts.has(comboString)) {
                e.preventDefault();
                this.shortcuts.get(comboString)(e);
            }
        });
    }
}
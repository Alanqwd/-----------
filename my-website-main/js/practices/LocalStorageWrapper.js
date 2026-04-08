export class LocalStorageWrapper {
    #prefix;

    constructor(prefix = 'app_') {
        this.#prefix = prefix;
    }

    #getKey(key) {
        return `${this.#prefix}${key}`;
    }

    set(key, value) {
        try {
            localStorage.setItem(this.#getKey(key), JSON.stringify(value));
        } catch (e) {
            console.error("Ошибка записи в LS", e);
        }
    }

    get(key) {
        try {
            const val = localStorage.getItem(this.#getKey(key));
            return val ? JSON.parse(val) : null;
        } catch (e) {
            console.error("Ошибка чтения из LS", e);
            return null;
        }
    }
    
    remove(key) {
        localStorage.removeItem(this.#getKey(key));
    }
}
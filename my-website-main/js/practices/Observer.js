class Subject {
    constructor() {
        this.observers = [];
    }
    subscribe(observer) {
        this.observers.push(observer);
    }
    unsubscribe(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }
    notify(data) {
        this.observers.forEach(obs => obs.update(data));
    }
}

class LoggerObserver {
    update(data) {
        console.log(`[Наблюдатель] Получено событие:`, data);
    }
}

export { Subject, LoggerObserver };
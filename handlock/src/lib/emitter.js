export default class Emitter {
    constructor() {
        this._events = {};
    }

    on(eventName, callback, context) {
        if (!this._events[eventName]) {
            this._events[eventName] = [];
        }

        this._events[eventName].push(callback);
    }

    off(eventName, callback) {
        if (!callback) {
            this._events[eventName].length = 0;
        }
        else {
            let cbIndex = this._events[eventName].indexOf(callback);
            this._events[eventName].splice(cbIndex, 1);
        }
    }

    fire(eventName, ...data) {
        if (this._events[eventName]) {
            this._events[eventName].forEach(event => {
                event.apply(null, data);
            });
        }
    }
}

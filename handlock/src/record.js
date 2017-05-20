import * as ls from './lib/ls';

export default class Record {
    constructor(options = {}) {
        const defaultOptions = {
            minLen: 4,
            lsKey: 'test'
        };

        this.options = Object.assign(defaultOptions, options);

        this.recording = false;

        this.data = [];
    }

    add(id) {
        if (this.data.indexOf(id) == -1) {
            this.data.push(id);
            return true;
        }
    }

    checkSame(pwd) {
        return pwd.join('') === this.data.join('');
    }

    checkValid() {
        const me = this;

        return new Promise((resolve, reject) => {
            // do ajax
            let pwd = ls.get(me.options.lsKey);

            me.checkSame(pwd) ? resolve() : reject();
        });
    }

    checkLength() {
        const minLen = this.options.minLen;

        return this.data.length >= minLen || minLen;
    }

    save() {
        const lsKey = this.options.lsKey;

        const me = this;

        return new Promise((resolve, reject) => {
            try {
                // do ajax
                ls.set(lsKey, JSON.stringify(me.data));

                me.reset();

                resolve();
            }

            catch (e) {
                reject();
            }
        });
    }

    reset() {
        this.recording = false;
        this.data = [];
    }

    dispose() {

    }
}

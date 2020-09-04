class Observer {
    constructor(data) {
        this.observe(data);
    }
    observe(data) {
        if (data && typeof data === 'object') {
            Object.keys(data).forEach(key => {
                this.defineReactive(data, key, data[key]);
            })
        }
    }
    defineReactive(data, key, value) {
        this.observe(value);
        const dep = new Dep();
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: true,
            get() {
                if (Dep.target) {
                    dep.addSub(Dep.target)
                }
                return value;
            },
            set: newVal => {
                this.observe(newVal);
                if (newVal !== value) {
                    value = newVal;
                }
                dep.notify();
            }
        })
    }
}


class Dep {
    constructor() {
        this.subs = [];
    }
    addSub(watcher) {
        this.subs.push(watcher);
    }
    notify() {
        this.subs.forEach(w => {
            w.update();
        })
    }
}


class Watcher {

    constructor(vm, attr, callback) {
        this.vm = vm;
        this.attr = attr;
        this.callback = callback;
        this.oldVal = this.getOldVal();
    }

    getOldVal() {
        Dep.target = this;
        let oldVal = compileUtil.getVal(this.attr, this.vm);
        Dep.target = null;
        return oldVal;
    }

    update() {
        let newVal = compileUtil.getVal(this.attr, this.vm);
        if (newVal !== this.oldVal) {
            this.callback(newVal);
        }
    }

}
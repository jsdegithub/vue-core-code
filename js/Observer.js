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
    defineReactive(obj, key, value) {
        this.observe(value);
        const dep = new Dep();
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get() {
                Dep.target && dep.addSub(Dep.target);
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
        console.log('通知了观察者');
        this.subs.forEach(w => w.update());
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
        let oldVal = compileUtil.getval(this.attr, this.vm);
        Dep.target = null;
        return oldVal;
    }
    update() {
        let newval = compileUtil.getval(this.attr, this.vm);
        if (newval !== this.oldVal) {
            this.callback(newval);
        }
    }
}
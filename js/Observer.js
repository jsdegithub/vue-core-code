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
                //若当前全局watcher有值，就将当前的全局watcher添加到dep实例的subs中去
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
    // getOldVal只有在 new Watcher的时候才会调用，而 new Watcher只有在 new Compiler时才会调用，
    // 所以 getOldVal只有在初始页面渲染时才会调用一次，所以每个数据只会被添加一个 watcher。
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
class Observer {
    constructor(data) {
        this.observe(data);
    }
    observe(data) {
        if (data && typeof data === "object") {
            Object.keys(data).forEach((key) => {
                this.defineReactive(data, key, data[key]);
            });
        }
    }
    defineReactive(obj, key, value) {
        this.observe(value);
        const dep = new Dep();
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get() {
                // 若当前全局watcher有值，就将当前的全局watcher添加到dep实例的subs中去
                // 页面初始化第一次调用new Compiler()时，由Watcher的getInitialVal可知，每一个属性
                // 的依赖收集器都会添加这个属性的watcher，且只添加这一个
                // 因为只有在 new Watcher()时才会调用new Compiler()，才会调用getInitialVal
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set: (newVal) => {
                // 当更改了一个对象时，它内部的属性不再是响应式
                // 例如先设置vm.$data.person={name:'lmy', age:30}
                // 再设置vm.$data.person.name='jinshuo',那么第二条命令输入后的视图将不会更改
                // 所以使用 this.observe(newVal)，使得当新属性被设置新值时，让它重新变成响应式
                // 但如果只这么做，则只能改变data中的数据，并没有绑定watcher去更新视图
                // 这又应该如何解决？？？？？？？？？？？？？？？？？？？？？？？？？？
                // ？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？？
                this.observe(newVal);
                if (newVal !== value) {
                    value = newVal;
                }
                // 通知更新
                dep.notify();
            },
        });
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
        this.subs.forEach((w) => w.update());
    }
}

class Watcher {
    constructor(vm, attr, callback) {
        this.vm = vm;
        this.attr = attr;
        this.callback = callback;
        this.initialVal = this.getInitialVal();
    }
    // getInitialVal只在页面初始渲染的时候才调用，它的作用是为每个属性添加watcher
    // getInitialVal调用时，语句 Dep.target=this会触发 Dep.target && dep.addSub(Dep.target),
    // 为每个属性的依赖收集器subs添加watcher
    // getInitialVal只有在 new Watcher的时候才会调用，而 new Watcher只有在 new Compiler时才会调用，
    // 所以 getInitialVal只有在初始页面渲染时才会调用一次，所以每个属性只会被添加一个 watcher。
    getInitialVal() {
        Dep.target = this;
        let initialVal = compileUtil.getval(this.attr, this.vm);
        Dep.target = null;
        return initialVal;
    }
    update() {
        let newval = compileUtil.getval(this.attr, this.vm);
        this.callback(newval);
    }
}
